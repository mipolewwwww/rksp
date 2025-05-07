import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { TaskList } from './pages/TaskList';
import './App.css';
import axios from 'axios';

const initializeAssistant = (getState, getRecoveryState) => {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,
      nativePanel: {
        defaultText: 'Что вы хотите сделать?',
        screenshotMode: false,
        tabIndex: -1,
      },
    });
  }
  return createAssistant({ getState });
};

const getOrCreateUserId = () => {
  let userId = localStorage.getItem('expenseTrackerUserId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('expenseTrackerUserId', userId);
  }
  return userId;
};

export class App extends React.Component {
  constructor(props) {
    super(props);
    this.userId = getOrCreateUserId();
    this.state = {
      tasks: [],
      categories: ["Продукты", "Транспорт", "ЖКХ", "Развлечения", "Одежда", "Другое"],
      selectedTaskId: null,
      assistantError: null,
      isLoading: true,
      assistant: null,
      isMounted: false,
      editingTask: null
    };
    this.setupAssistantHandlers = this.setupAssistantHandlers.bind(this);
    this.handleSelectTask = this.handleSelectTask.bind(this);
  }

  componentDidMount() {
    this.setState({ isMounted: true });
    this.loadTasks();
    const assistant = initializeAssistant(() => this.getStateForAssistant());
    this.setState({ assistant }, () => {
      this.setupAssistantHandlers(assistant);
    });
  }

  setupAssistantHandlers(assistant) {
    assistant.on('data', (event) => {
      if (event.type === 'character') {
        console.log(`assistant.on(data): character: "${event?.character?.id}"`);
      } else if (event.type === 'insets') {
        console.log('assistant.on(data): insets');
      } else {
        const { action } = event;
        this.dispatchAssistantAction(action);
      }
    });

    assistant.on('start', (event) => {
      console.log('assistant.on(start)', event, assistant.getInitialData());
    });

    assistant.on('error', (error) => {
      console.error('assistant.on(error)', error);
      this.setState({ assistantError: 'Ошибка в работе ассистента' });
    });
  }

  dispatchAssistantAction(action) {
    if (!action) return;

    switch (action.type) {
      case 'add_note':
        this.handleAddTask(action.note, action.price, action.category || 'Другое');
        break;
      case 'delete_note':
      case 'delete_expense':
      case 'remove_note':
        this.handleDeleteTask(action.id || this.state.selectedTaskId);
        break;
      case 'select_item':
        if (action.id) this.handleSelectTask(Number(action.id));
        break;
      default:
        console.warn('Неизвестное действие:', action);
    }
  }

  getStateForAssistant() {
    return {
      item_selector: {
        items: this.state.tasks.map((task, index) => ({
          number: index + 1,
          id: task.id,
          title: `${task.title} - ${task.amount} руб.`,
          category: task.category
        })),
        ignored_words: [
          'добавить', 'установить', 'запиши', 'поставь', 'закинь',
          'удалить', 'удали', 'выбери', 'выбрать', 'покажи'
        ],
      },
      current_selected: this.state.selectedTaskId,
      categories: this.state.categories
    };
  }

  loadTasks = () => {
    this.setState({ isLoading: true });
    axios.get('https://servachello.onrender.com/api/expenses', {
      params: { userId: this.userId }
    })
    .then(response => {
      if (this.state.isMounted) {
        this.setState({ 
          tasks: response.data || [],
          isLoading: false 
        });
      }
    })
    .catch(error => {
      if (this.state.isMounted) {
        this.setState({ 
          assistantError: 'Ошибка загрузки данных',
          isLoading: false 
        });
      }
    });
  };

  handleAddTask = (title, amount, category) => {
    const newTask = {
      id: Date.now(),
      title,
      amount: Number(amount),
      category,
      userId: this.userId
    };

    this.setState({ isLoading: true });
    axios.post('https://servachello.onrender.com/api/expenses', newTask)
      .then(response => {
        if (this.state.isMounted) {
          this.setState(prevState => ({
            tasks: [...prevState.tasks, response.data],
            isLoading: false
          }));
        }
      })
      .catch(error => {
        if (this.state.isMounted) {
          this.setState({ 
            assistantError: 'Не удалось добавить задачу',
            isLoading: false
          });
        }
      });
  };

  handleDeleteTask = (taskId) => {
    if (!taskId) {
      this.setState({ assistantError: 'Не выбран ID задачи' });
      return;
    }

    this.setState({ isLoading: true });
    axios.delete(`https://servachello.onrender.com/api/expenses/${taskId}`, {
      params: { userId: this.userId }
    })
    .then(response => {
      if (this.state.isMounted && response.data?.success) {
        this.setState(prevState => ({
          tasks: prevState.tasks.filter(task => task.id !== taskId),
          selectedTaskId: null,
          isLoading: false
        }));
      }
    })
    .catch(error => {
      if (this.state.isMounted) {
        this.setState({ 
          assistantError: error.response?.data?.error || 'Задача не найдена',
          isLoading: false 
        });
      }
    });
  };

  handleEditTask = (task) => {
    if (!task?.id) {
      this.setState({ assistantError: 'Не выбрана задача для редактирования' });
      return;
    }

    const existingTask = this.state.tasks.find(t => t.id === task.id);
    if (!existingTask) {
      this.setState({ assistantError: 'Задача не найдена' });
      return;
    }

    this.setState({ 
      editingTask: existingTask,
      assistantError: null
    });
  };

  handleUpdateTask = (updatedTask) => {
    if (!updatedTask?.id) {
      this.setState({ assistantError: 'Не выбран ID задачи' });
      return;
    }

    this.setState({ isLoading: true });
    axios.put(`https://servachello.onrender.com/api/expenses/${updatedTask.id}`, updatedTask)
      .then(response => {
        if (this.state.isMounted) {
          this.setState(prevState => ({
            tasks: prevState.tasks.map(task => 
              task.id === updatedTask.id ? response.data : task
            ),
            editingTask: null,
            isLoading: false
          }));
        }
      })
      .catch(error => {
        if (this.state.isMounted) {
          this.setState({ 
            assistantError: error.response?.data?.error || 'Задача не найдена',
            isLoading: false
          });
        }
      });
  };

  handleSelectTask = (taskId) => {
    this.setState({ selectedTaskId: taskId });
  };

  handleAddCategory = (category) => {
    if (category && !this.state.categories.includes(category)) {
      this.setState(prevState => ({
        categories: [...prevState.categories, category]
      }));
    }
  };

  componentWillUnmount() {
    this.setState({ isMounted: false });
  }

  render() {
    const { tasks, categories, assistantError, isLoading, editingTask } = this.state;

    return (
      <div className="app-container">
        <h1>Управление расходами</h1>
        
        {assistantError && (
          <div className="error-notification">
            <div className="error-message">
              <span className="error-icon">!</span>
              <span>{assistantError}</span>
            </div>
            <button 
              className="error-close"
              onClick={() => this.setState({ assistantError: null })}
            >
              &times;
            </button>
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Обновление данных...</p>
          </div>
        )}

        <TaskList
          tasks={tasks}
          categories={categories}
          onAdd={this.handleAddTask}
          onDelete={this.handleDeleteTask}
          onEdit={this.handleEditTask}
          onAddCategory={this.handleAddCategory}
          selectedTaskId={this.state.selectedTaskId}
          onSelectTask={this.handleSelectTask}
        />

        {editingTask && (
          <div className="modal-overlay" onClick={() => this.setState({ editingTask: null })}>
            <div className="edit-modal" onClick={e => e.stopPropagation()}>
              <h2>Редактирование записи #{editingTask.id}</h2>
              
              {this.state.assistantError && (
                <div className="modal-error">
                  {this.state.assistantError}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                this.handleUpdateTask({
                  id: editingTask.id,
                  title: e.target.title.value,
                  amount: e.target.amount.value,
                  category: e.target.category.value
                });
              }}>
                <div className="form-group">
                  <label>
                    Название:
                    <input
                      name="title"
                      type="text"
                      defaultValue={editingTask.title}
                      required
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Сумма (₽):
                    <input
                      name="amount"
                      type="number"
                      defaultValue={editingTask.amount}
                      required
                      min="0"
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Категория:
                    <select
                      name="category"
                      defaultValue={editingTask.category}
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    Сохранить
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => this.setState({ editingTask: null })}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
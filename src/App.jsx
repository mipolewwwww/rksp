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
        console.log('constructor');
        this.userId = getOrCreateUserId();
        this.state = {
            tasks: [],
            categories: ["Продукты", "Транспорт", "ЖКХ", "Развлечения", "Одежда"],
            newCategory: "",
            selectedTaskId: null,
            assistantError: null,
            isLoading: true,
            assistant: null,
            isMounted: false
        };
    }

    ccomponentDidMount() {
        this.setState({ isMounted: true }, () => { // Устанавливаем isMounted перед инициализацией
            const assistant = initializeAssistant(() => this.getStateForAssistant());
            console.log('Assistant instance:', assistant);
            this.setState({ assistant }, () => {
                this.setupAssistantHandlers(this.state.assistant); // Передаем из состояния
            });
            this.loadInitialData();
        });
    }
    
    

    async loadInitialData() {
        try {
            const response = await axios.get('https://servachello.onrender.com/api/expenses', {
                params: { userId: this.userId },
                headers: { 'Cache-Control': 'no-cache' }
            });

            const loadedCategories = [...new Set((response.data?.map(task => task.category) || []))].filter(Boolean);
            if (this.state.isMounted) {
                this.setState({
                    tasks: response.data || [],
                    categories: [...new Set([...this.state.categories, ...loadedCategories])],
                    isLoading: false
                });
            }

        } catch (error) {
            console.error('Load Error:', error.response?.data || error.message);
            if (this.state.isMounted) {
                this.setState({
                    assistantError: 'Ошибка загрузки данных',
                    isLoading: false
                });
            }
            this.sendErrorToAssistant('Ошибка загрузки данных');
        }
    }

    setupAssistantHandlers = (assistant) => {
        assistant.on('data', (event) => {
            console.log('assistant.on(data) event:', event);
    
            // Обрабатываем каждое событие data, проверяя его тип
            if (event.type === 'character') {
                console.log(`assistant.on(data): character: "${event?.character?.id}"`);
            } else if (event.type === 'insets') {
                console.log('assistant.on(data): insets');
            } else if (event.type === 'tts_state_update') {
                console.log('assistant.on(data): tts_state_update');
                // Здесь можно обработать обновление статуса TTS, если это необходимо
            } else {
                // Предполагаем, что это действие, и пытаемся его обработать
                const action = event?.action?.server_action?.action;
                if (action) {
                    this.dispatchAssistantAction(action);
                } else {
                    console.warn('assistant.on(data): Received event without action:', event);
                    // Обработка случая, когда в событии нет действия
                }
            }
        });
    
        assistant.on('start', (event) => {
            console.log('assistant.on(start)', event, assistant.getInitialData());
        });
    
        assistant.on('error', (error) => {
            console.error('assistant.on(error)', error);
            this.setState({ assistantError: 'Ошибка в работе ассистента' });
            this.sendErrorToAssistant('Ошибка в работе ассистента');
        });
    };
    
    

    sendErrorToAssistant(message) {
        const { assistant } = this.state;
        if (assistant && assistant.state === 'OPEN') {
            assistant.sendData({
                action: {
                    type: 'error',
                    message: message,
                },
            });
        }
    }

    getStateForAssistant() {
        console.log('getStateForAssistant: this.state:', this.state);
        return {
            item_selector: {
                items: this.state.tasks.map((task, index) => ({
                    number: index + 1,
                    id: task.id,
                    title: `${task.title} - ${task.amount} руб.`,
                    category: task.category
                })),
                ignored_words: [
                ],
            },
            current_selected: this.state.selectedTaskId,
            categories: this.state.categories
        };
    };

    dispatchAssistantAction = (action) => {
        console.log('dispatchAssistantAction', action);
        if (action) {
            switch (action.type) {
                case 'add_note':
                    this.handleAddTask(action.note, action.price, action.category || 'Другое');
                    break;
                case 'delete_note':
                case 'delete_expense':
                case 'remove_note':
                    this.handleDeleteTask(action.id || this.state.selectedTaskId);
                    break;
                default:
                    console.warn('Неизвестное действие:', action);
            }
        }
    };

    handleAddTask = async (title, amount, category) => {
        const newTask = {
            id: Date.now(),
            title,
            amount: Number(amount),
            category,
            userId: this.userId
        };

        this.setState({ isLoading: true });

        try {
            const response = await axios.post('https://servachello.onrender.com/api/expenses', newTask);
            if (this.state.isMounted) {
                this.setState(prevState => ({
                    tasks: [...prevState.tasks, response.data],
                    isLoading: false
                }));
            }


        } catch (error) {
            console.error('Ошибка при добавлении задачи:', error);
            const errorMessage = error.response?.data?.message || 'Не удалось добавить задачу';
            if (this.state.isMounted) {
                this.setState({
                    assistantError: errorMessage,
                    isLoading: false
                });
            }
            this.sendErrorToAssistant(errorMessage);
        }
    };

    handleDeleteTask = async (taskId) => {
        if (!taskId || taskId === 'undefined') {
            const errorMessage = 'Ошибка: некорректный ID задачи';
            this.setState({ assistantError: errorMessage });
            this.sendErrorToAssistant(errorMessage);
            return;
        }
        this.setState({ isLoading: true });
        try {
            const response = await axios.delete(
                `https://servachello.onrender.com/api/expenses/${taskId}`,
                { params: { userId: this.userId } }
            );

            if (this.state.isMounted && response.data?.success) {
                this.setState(prevState => ({
                    tasks: prevState.tasks.filter(task => task.id !== taskId),
                    selectedTaskId: null,
                    isLoading: false
                }));
            }
        } catch (error) {
            console.error('Delete Error:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || 'Unknown error';
            if (this.state.isMounted) {
                this.setState({
                    assistantError: errorMessage,
                    isLoading: false
                });
            }
            this.sendErrorToAssistant(errorMessage);
        }
    };

    handleSelectTask = (taskId) => {
        this.setState({ selectedTaskId: taskId });
    };

    handleAddCategory = (category) => {
        if (category.trim() && !this.state.categories.includes(category)) {
            this.setState(prevState => ({
                categories: [...prevState.categories, category]
            }));
            return true;
        }
        return false;
    };

    componentWillUnmount() {
        this.setState({ isMounted: false });
        if (this.state.assistant && typeof this.state.assistant.destroy === 'function') {
            this.state.assistant.destroy();
        }
    }

    render() {
        const { tasks, categories, selectedTaskId, assistantError, isLoading } = this.state;

        if (isLoading) {
            return (
                <div className="app-container">
                    <div className="loading-indicator">Загрузка данных...</div>
                </div>
            );
        }

        return (
            <div className="app-container">
                <h1>Управление расходами</h1>
                {assistantError && (
                    <div className="assistant-error">
                        {assistantError}
                        <button onClick={() => this.setState({ assistantError: null })}>
                            ×
                        </button>
                    </div>
                )}
                <TaskList
                    tasks={tasks}
                    categories={categories}
                    onAdd={this.handleAddTask}
                    onDelete={this.handleDeleteTask}
                    onAddCategory={this.handleAddCategory}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={this.handleSelectTask}
                />
            </div>
        );
    }
}

export default App;


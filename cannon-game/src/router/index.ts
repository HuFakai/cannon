
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import LocalGame from '../views/LocalGame.vue';
import AIGame from '../views/AIGame.vue';
import OnlineGame from '../views/OnlineGame.vue';
import Settings from '../views/Settings.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home
        },
        {
            path: '/local',
            name: 'LocalGame',
            component: LocalGame
        },
        {
            path: '/ai',
            name: 'AIGame',
            component: AIGame
        },
        {
            path: '/online',
            name: 'OnlineGame',
            component: OnlineGame
        },
        {
            path: '/settings',
            name: 'Settings',
            component: Settings
        }
    ]
});

export default router;

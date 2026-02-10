import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import i18n from './i18n';

import PhosphorIcons from '@phosphor-icons/vue';

import './styles/theme.css';
import './styles/common.less';

const app = createApp(App);
app.use(router);
app.use(i18n);
app.use(PhosphorIcons);
app.mount('#app');

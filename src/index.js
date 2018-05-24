import axios from 'axios';

const todoAPI = axios.create({
  baseURL: process.env.API_URL
});

function login(token) {
  localStorage.setItem('token', token);
  todoAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
}

function logout() {
  localStorage.removeItem('token');
  delete todoAPI.defaults.headers['Authorization'];
}

const rootEl = document.querySelector('.root');

todoAPI.interceptors.request.use(function (config) {
  rootEl.classList.add('root--loading');
  return config;
});
todoAPI.interceptors.response.use(function (response) {
  rootEl.classList.remove('root--loading');
  return response;
})

const templates = {
  login: document.querySelector('#login').content,
  index: document.querySelector('#index').content,
  todoItem: document.querySelector('#todo-item').content,
}

function render(frag) {
  rootEl.textContent = '';
  rootEl.appendChild(frag);
}

async function loginPage() {
  const frag = document.importNode(templates.login, true);
  const formEl = frag.querySelector('.login__form');
  formEl.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value,
    };
    const res = await todoAPI.post('/users/login', payload);
    login(res.data.token);
    indexPage();
  })
  render(frag);
}

async function indexPage() {
  const frag = document.importNode(templates.index, true);
  const listEl = frag.querySelector('.index__todo-list');
  const formEl = frag.querySelector('.index__form');
  const logoutBtnEl = frag.querySelector('.index__logout-btn');

  formEl.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      body: e.target.elements.body.value,
      complete: false,
    };
    const res = await todoAPI.post('/todos', payload);
    indexPage();
  });

  logoutBtnEl.addEventListener('click', e => {
    logout();
    loginPage();
  });

  const res = await todoAPI.get('/todos');

  for (const {id, body, complete} of res.data) {
    const itemFrag = document.importNode(templates.todoItem, true);
    const itemEl = itemFrag.querySelector('.todo-item');
    const bodyEl = itemFrag.querySelector('.todo-item__body');
    const checkboxEl = itemFrag.querySelector('.todo-item__checkbox');
    const removeBtnEl = itemFrag.querySelector('.todo-item__remove-btn');

    bodyEl.textContent = body;
    if (complete) {
      itemEl.classList.add('todo-item--complete');
      checkboxEl.setAttribute('checked', '');
    }
    checkboxEl.addEventListener('click', async e => {
      e.preventDefault();
      const res = await todoAPI.patch(`/todos/${id}`, {
        complete: !complete
      });
      indexPage();
    })
    removeBtnEl.addEventListener('click', async e => {
      const res = await todoAPI.delete(`/todos/${id}`);
      indexPage();
    })

    listEl.appendChild(itemFrag);
  }

  render(frag);
}

const token = localStorage.getItem('token');
if (token) {
  login(token);
  indexPage();
} else {
  loginPage();
}

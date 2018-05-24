import axios from 'axios';

const todoAPI = axios.create({
  baseURL: process.env.API_URL
});

const rootEl = document.querySelector('.root');

const templates = {
  login: document.querySelector('#login').content,
  index: document.querySelector('#index').content,
  todoItem: document.querySelector('#todo-item').content,
}

function render(frag) {
  rootEl.textContent = '';
  rootEl.appendChild(frag);
}

function login(token) {
  localStorage.setItem('token', token);
  todoAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
}

function logout() {
  localStorage.removeItem('token');
  delete todoAPI.defaults.headers['Authorization'];
}

// 로딩 인디케이터 표시 함수. Promise 객체를 인수로 받습니다.
// (비동기 함수 역시 Promise 객체를 반환하는 점에 주목하세요!)
async function withLoading(promise) {
  rootEl.classList.add('root--loading');
  const value = await promise;
  rootEl.classList.remove('root--loading');
  return value;
}

async function loginPage() {
  // DocumentFragment는 문서에 삽입된 뒤에는 비워지기 때문에,
  // appendChild가 일어나기 전에 미리 엘리먼트 객체를 선택해 놓는 것이 좋습니다.
  // https://developer.mozilla.org/ko/docs/Web/API/DocumentFragment
  const frag = document.importNode(templates.login, true);
  const formEl = frag.querySelector('.login__form');

  formEl.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value,
    };
    const res = await withLoading(todoAPI.post('/users/login', payload));
    login(res.data.token);
    indexPage();
  })
  render(frag);
}

async function indexPage() {
  // DocumentFragment는 문서에 삽입된 뒤에는 비워지기 때문에,
  // appendChild가 일어나기 전에 미리 엘리먼트 객체를 선택해 놓는 것이 좋습니다.
  // https://developer.mozilla.org/ko/docs/Web/API/DocumentFragment
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
    const res = await withLoading(todoAPI.post('/todos', payload));
    indexPage();
  });

  logoutBtnEl.addEventListener('click', e => {
    logout();
    loginPage();
  });

  const res = await withLoading(todoAPI.get('/todos'));

  // forEach 메소드 대신 for...of 루프를 사용할 수도 있습니다.
  // res.data 배열에 들어있는 객체에 대해 분해대입을 했습니다.
  for (const {id, body, complete} of res.data) {
    const itemFrag = document.importNode(templates.todoItem, true);
    const itemEl = itemFrag.querySelector('.todo-item');
    const bodyEl = itemFrag.querySelector('.todo-item__body');
    const checkboxEl = itemFrag.querySelector('.todo-item__checkbox');
    const removeBtnEl = itemFrag.querySelector('.todo-item__remove-btn');

    bodyEl.textContent = body;
    if (complete) {
      itemEl.classList.add('todo-item--complete');
      // checkbox 타입의 input 태그에 'checked' 어트리뷰트를 넣어주면
      // 체크가 된 상태로 만들 수 있습니다.
      checkboxEl.setAttribute('checked', '');
    }
    checkboxEl.addEventListener('click', async e => {
      e.preventDefault();
      const res = await withLoading(todoAPI.patch(`/todos/${id}`, {
        complete: !complete
      }));
      indexPage();
    })
    removeBtnEl.addEventListener('click', async e => {
      const res = await withLoading(todoAPI.delete(`/todos/${id}`));
      indexPage();
    })

    listEl.appendChild(itemFrag);
  }

  render(frag);
}

// 만약 로그인이 되어있던 상태라면 할 일 목록을 보여주고,
// 아니면 로그인 페이지를 보여줍니다.
const token = localStorage.getItem('token');
if (token) {
  login(token);
  indexPage();
} else {
  loginPage();
}

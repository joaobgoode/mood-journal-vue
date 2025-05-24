<template>
  <div class="screen-container" style="background-color: transparent;">
    <form v-if="userIsLoggingIn" @submit.prevent="handleLogin" class="container mt-5 login-form"
      style='padding-bottom:0; padding-left: 0; padding-right: 0; border-radius: 15px;'>
      <img :src="onPassword ? MoodSenha : Mood1" alt="MoodForm" class="mood-image" />
      <div class="form-group">
        <label for="usuario">Usuário:</label>
        <input v-model="usuarioLogin" type="text" class="form-control" id="usuario" />
      </div>
      <div class="form-group">
        <label for="senha">Senha:</label>
        <input v-model="senhaLogin" type="password" class="form-control" id="senha" @focus='onPassword = true'
          @blur="onPassword = false" />
      </div>
      <button type="submit" class="btn confirm-button" style="border-radius: 0 0 0 15px">Entrar</button>
      <button type="button" class="btn toggle-button" @click="toggleLoginRegister"
        style="border-radius: 0 0 15px 0">Registrar</button>
    </form>

    <form v-else @submit.prevent="handleRegister" class="container mt-5 login-form"
      style='padding-bottom:0; padding-left: 0; padding-right: 0;  border-radius: 15px;'>
      <div class="form-group">
        <label for="usuario-register">Usuário:</label>
        <input v-model="usuarioRegister" type="text" class="form-control" id="usuario-register" />

        <label for="email">Email:</label>
        <input v-model="emailRegister" type="email" class="form-control" id="email" />

        <label for="senha-register">Senha:</label>
        <input v-model="senhaRegister" type="password" class="form-control" id="senha-register" />

        <label for="confirmar-senha">Confirmar Senha:</label>
        <input v-model="confirmarSenhaRegister" type="password" class="form-control" id="confirmar-senha" />

        <div v-if="errorDisplay" class="error-message alert alert-danger mt-2">
          <ul>
            <li v-for="(error, index) in errorMessage" :key="index">{{ error }}</li>
          </ul>
        </div>

        <button type="button" class="btn toggle-button" @click="toggleLoginRegister"
          style="border-radius: 0 0 0 15px">Entrar</button>
        <button type="submit" class="btn confirm-button" style="border-radius: 0 0 15px 0">Registrar</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import axios from 'axios';
import router from '../router/index.js';
import MoodSenha from '../assets/images/MoodSenha.png'
import Mood1 from '../assets/images/Mood1.png'

onBeforeMount(() => {
  const accessToken = localStorage.getItem('access');
  const refreshToken = localStorage.getItem('refresh');
  if (accessToken && refreshToken) {
    router.push({ name: 'Mood' });
  }
});

const userIsLoggingIn = ref(true);

const usuarioLogin = ref('');
const senhaLogin = ref('');

const usuarioRegister = ref('');
const emailRegister = ref('');
const senhaRegister = ref('');
const confirmarSenhaRegister = ref('');

const isRegisterUserValid = ref(true);
const isRegisterEmailValid = ref(true);
const isRegisterPasswordValid = ref(true);
const isRegisterConfirmPasswordValid = ref(true);
const errorMessage = ref([]);
const errorDisplay = ref(false);

const onPassword = ref(false);

function toggleLoginRegister() {
  userIsLoggingIn.value = !userIsLoggingIn.value;
}

async function handleLogin() {
  let valid = true;
  errorMessage.value = [];
  if (!senhaLogin.value || !usuarioLogin.value) {
    valid = false;
    errorMessage.value.push('Usuário e senha são obrigatórios');
    return;
  }
  const res = await axios.post(import.meta.env.VITE_BASE_URL + '/api/token/', {
    "username": usuarioLogin.value,
    "password": senhaLogin.value
  });
  if (res.status === 200) {
    const accessToken = res.data.access;
    const refreshToken = res.data.refresh;
    localStorage.setItem('access', accessToken);
    localStorage.setItem('refresh', refreshToken);
    router.push({ name: 'Mood' });
  } else {
    errorMessage.value.push('Erro ao realizar login');
  }
}

async function handleRegister() {
  let valid = true;
  errorMessage.value = [];
  errorDisplay.value = false;

  if (senhaRegister.value !== confirmarSenhaRegister.value) {
    isRegisterConfirmPasswordValid.value = false;
    isRegisterPasswordValid.value = false;
    valid = false;
    errorMessage.value.push('Senha e confirmar senha não são iguais');
  }

  if (senhaRegister.value.length < 8) {
    isRegisterPasswordValid.value = false;
    valid = false;
    errorMessage.value.push('Senha deve ter no mínimo 8 caracteres');
  }

  if (!/[a-z]/.test(senhaRegister.value)) {
    isRegisterPasswordValid.value = false;
    valid = false;
    errorMessage.value.push('Senha deve conter pelo menos uma letra minúscula');
  }

  if (!/[A-Z]/.test(senhaRegister.value)) {
    isRegisterPasswordValid.value = false;
    valid = false;
    errorMessage.value.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  if (!/[0-9]/.test(senhaRegister.value)) {
    isRegisterPasswordValid.value = false;
    valid = false;
    errorMessage.value.push('Senha deve conter pelo menos um número');
  }

  if (usuarioRegister.value.length < 8) {
    isRegisterUserValid.value = false;
    valid = false;
    errorMessage.value.push('Usuário deve ter no mínimo 8 caracteres');
  }

  if (emailRegister.value.length < 5 || !emailRegister.value.includes('@')) {
    isRegisterEmailValid.value = false;
    valid = false;
    errorMessage.value.push('Email inválido');
  }

  if (!valid) {
    errorDisplay.value = true;
    return;
  }
  try {
    const res = await axios.post(import.meta.env.VITE_BASE_URL + '/api/register/', {
      "username": usuarioRegister.value,
      "password": senhaRegister.value,
      "password2": confirmarSenhaRegister.value,
      "email": emailRegister.value
    });
    if (res.status === 201) {
      alert('Usuário registrado com sucesso!');
      toggleLoginRegister();
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      const data = error.response.data;
      if (data.username) {
        errorMessage.value.push('Usuário já existe');
      }
    } else {
      errorMessage.value.push('Erro ao registrar usuário');
    }
    errorDisplay.value = true;
  }
}

</script>

<style scoped>
.screen-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-form {
  max-width: 400px;
  width: 100%;
  padding: 20px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.invalid {
  border-color: red;
}

#senha {
  margin-bottom: 20px;
}

button {
  position: relative;
  bottom: 0;
}

input {
  margin-left: 20px;
  margin-right: 20px;
  margin-bottom: 10px;
  width: calc(100% - 40px);
}

label {
  margin-left: 20px;
  margin-right: 20px;
  width: calc(100% - 40px);
}


button {
  min-width: 50%;
  max-width: 50%;
}

.error-message {
  margin-left: 20px;
  margin-right: 20px;
  width: calc(100% - 40px);
}

.confirm-button {
  background-color: purple;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.toggle-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.mood-image {
  width: 90px;
  height: 90px;
  margin-bottom: 20px;
  border-radius: 5px;
  margin-left: calc(50% - 45px);
}
</style>

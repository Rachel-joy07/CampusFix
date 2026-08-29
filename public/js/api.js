/*
Authors:2462148-Sheryn Anand
                2462106-Kuragayala Rachel
Duration: 20/08/2026-27/08/2026
Description: 
This file serves as the central frontend JavaScript module for handling backend API communications.
It encapsulates all fetch requests, including authentication headers, to seamlessly interact with the server.
It provides reusable functions for fetching data, submitting forms, and handling API errors gracefully.
*/
// api.js - tiny fetch wrapper shared by every page.
// Stores the JWT + user object in memory-safe localStorage (fine for a
// college demo project running on localhost).

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('cf_token');
}
function getUser() {
  const raw = localStorage.getItem('cf_user');
  return raw ? JSON.parse(raw) : null;
}
// A simple helper to stash the user's login token and details in localStorage so they don't lose their session if they refresh the tab.
function setSession(token, user) {
  localStorage.setItem('cf_token', token);
  localStorage.setItem('cf_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('cf_token');
  localStorage.removeItem('cf_user');
}

// This function acts like a bouncer for our frontend pages. It kicks you back to the login screen if you aren't authenticated or if you don't have the right role (like trying to access the admin panel as a student).
function guard(requiredRole) {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = '/index.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = `/${user.role}/dashboard.html`;
    return null;
  }
  return user;
}

function logout() {
  clearSession();
  window.location.href = '/index.html';
}

// This is our central workhorse for talking to the backend. It automatically attaches your auth token to every request and handles JSON parsing so we don't have to repeat this logic everywhere.
async function api(path, { method = 'GET', body = null, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// simple, readable ticket-number formatter — CF-0001, CF-0002, ...
function fmtTicketId(id) {
  return `CF-${String(id).padStart(4, '0')}`;
}

function showMsg(el, message, isError = true) {
  el.textContent = message;
  el.style.display = message ? 'block' : 'none';
  el.className = isError ? 'error-msg' : 'success-msg';
  if (message) el.style.display = 'block';
}

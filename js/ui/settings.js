// Settings: language, sound, high contrast and a two-step reset.
import { h } from './dom.js';
import { app, persist, applySettings, resetProgress, go } from '../app.js';
import { t, getLang } from '../i18n.js';

export function render(root) {
  const d = app.data;
  const toggle = (label, prop) =>
    h('label', { class: 'switch' },
      h('span', null, label),
      h('input', { type: 'checkbox', checked: d.settings[prop] || null, onChange: (e) => { d.settings[prop] = e.target.checked; persist(); applySettings(); } }));
  const confirmBox = h('div', { class: 'confirm hidden', role: 'alertdialog' },
    h('p', null, t('settings.reset_confirm')),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn danger', onClick: () => { resetProgress(); applySettings(); go('home'); } }, t('settings.reset_yes')),
      h('button', { class: 'btn', onClick: () => confirmBox.classList.add('hidden') }, t('settings.cancel'))));

  // The language buttons live in the header; this is a second, larger switch.
  const langBtn = (code, label) =>
    h('button', { class: 'btn' + (getLang() === code ? ' primary' : ''), onClick: () => document.querySelector(`#lang [data-l="${code}"]`).click() }, label);

  root.append(
    h('h2', { class: 'screen-title' }, t('nav.settings')),
    h('section', { class: 'card' },
      h('div', { class: 'setting' }, h('span', null, t('settings.language')), h('div', { class: 'btn-row' }, langBtn('fr', 'Français'), langBtn('en', 'English'))),
      toggle(t('settings.sound'), 'sound'),
      toggle(t('settings.contrast'), 'contrast')),
    h('section', { class: 'card' },
      h('h3', null, t('settings.data')),
      h('button', { class: 'btn danger', onClick: () => confirmBox.classList.remove('hidden') }, t('settings.reset')),
      confirmBox),
    h('p', { class: 'muted small' }, t('settings.about')),
  );
}

import express from 'express';
import xss from 'xss';
import { insert, select } from './db.js';
import { body, validationResult } from 'express-validator';

const xss = require('xss');
const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

const { insert } = require('./db');

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
 *
 * @param {string} fieldName Heiti á reit
 * @returns {function} Middleware sem hreinsar reit ef hann finnst
 */
function sanitizeXss(fieldName) {
    return (req, res, next) => {
      if (!req.body) {
        next();
      }
  
      const field = req.body[fieldName];
  
      if (field) {
        req.body[fieldName] = xss(field);
      }
  
      next();
    };
  }

  const router = express.Router();

// Fylki af öllum validations fyrir undirskrift
const validations = [
  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

    check('name')
    .isLength({ max: 200 })
    .withMessage('Nafn má ekki vera stæra en 200 stafir'),

  check('id')
    .isEmail()
    .withMessage('Kennitala má ekki vera tóm'),

  check('id')
    .matches(/^[0-9]{3}( |-)?[0-9]{4}$/)
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),

  check('text')
    .isLength({ min: 100 })
    .withMessage('Athugasemd verður að vera að minnsta kosti 100 stafir'),

  check('text')
    .isLength({ min: 500 })
    .withMessage('Athugasemd má að hámarki vera 500 stafir'),
];

// Fylki af öllum hreinsunum fyrir undirskrift
const sanitazions = [
    sanitize('name').trim().escape(),
    sanitizeXss('name'),
  
    sanitizeXss('id'),
    sanitize('id').trim().normalizeEmail(),
  
    sanitizeXss('text'),
    sanitize('text').trim().escape(),
  ];
  
  /**
 * Route handler fyrir form undirskrifta.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Formi fyrir umsókn
 */
function form(req, res) {
    const data = {
      title: 'Undirskriftarlisti',
      name: '',
      id: '',
      text: '',
      errors: [],
    };
    res.render('form', data);
  }
  
/**
 * Route handler sem athugar stöðu á undirskriftir og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */

function showErrors(req, res, next) {
    const {
      body: {
        name = '',
        id = '',
        text = '',
      } = {},
    } = req;
  
    const data = {
      name,
      id,
      text,
    };
  
    const validation = validationResult(req);
  
    if (!validation.isEmpty()) {
      const errors = validation.array();
      data.errors = errors;
      data.title = 'Undirskriftarlisti – vandræði';
  
      return res.render('form', data);
    }
  
    return next();
  }

  /**
 * Ósamstilltur route handler sem vistar gögn í gagnagrunn og sendir
 * aftur á aðalsíðu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function formPost(req, res) {
    const {
      body: {
        name = '',
        id = '',
        text = '',
      } = {},
    } = req;
  
    const data = {
      name,
      id,
      text,
    };
  
    await insert(data);
  
    return res.redirect('/');
  }
  
  router.get('/', catchErrors(form));
  
  router.post(
    '/',
    // Athugar hvort form sé í lagi
    validations,
    // Ef form er ekki í lagi, birtir upplýsingar um það
    showErrors,
    // Öll gögn í lagi, hreinsa þau
    sanitazions,
    // Senda gögn í gagnagrunn
    catchErrors(formPost),
  );
  
  module.exports = router;
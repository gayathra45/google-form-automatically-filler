const { faker } = require('@faker-js/faker');

/**
 * Resolves a field rule into an actual string/array value for submission.
 * @param {Object} question - Question schema object
 * @param {Object} rule - Configuration rule for this question
 * @param {number} index - Current iteration index (1-based)
 * @param {Object} csvRow - Optional row from CSV
 */
function generateFieldValue(question, rule = {}, index = 1, csvRow = null) {
  const mode = rule.mode || 'random_option';

  // If CSV row is supplied and field is mapped to CSV column
  if (rule.csvColumn && csvRow && csvRow[rule.csvColumn] !== undefined) {
    return String(csvRow[rule.csvColumn]);
  }

  switch (mode) {
    case 'fixed': {
      let val = rule.fixedValue || '';
      // Support template variables
      val = val.replace(/\{index\}/g, String(index));
      val = val.replace(/\{random\}/g, Math.floor(Math.random() * 1000).toString());
      val = val.replace(/\{date\}/g, new Date().toISOString().split('T')[0]);
      return val;
    }

    case 'counter': {
      const start = Number(rule.counterStart || 1);
      const prefix = rule.counterPrefix || '';
      const suffix = rule.counterSuffix || '';
      return `${prefix}${start + (index - 1)}${suffix}`;
    }

    case 'random_option': {
      if (question.type === 'scale') {
        const min = question.scaleMin ?? 1;
        const max = question.scaleMax ?? 5;
        return String(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      if (question.type === 'checkbox' && question.options?.length > 0) {
        // Pick 1 to N random options
        const maxPick = Math.min(question.options.length, Number(rule.maxCheckboxPicks || 2));
        const count = Math.max(1, Math.floor(Math.random() * maxPick) + 1);
        const shuffled = [...question.options].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      }
      if (question.options && question.options.length > 0) {
        const randomIndex = Math.floor(Math.random() * question.options.length);
        return question.options[randomIndex];
      }
      // Fallback for text fields if random_option was selected
      return faker.word.words(3);
    }

    case 'specific_option': {
      if (rule.selectedOption) {
        return rule.selectedOption;
      }
      if (Array.isArray(rule.selectedOptions) && rule.selectedOptions.length > 0) {
        return rule.selectedOptions;
      }
      return question.options?.[0] || '';
    }

    // Faker generators
    case 'faker_full_name':
      return faker.person.fullName();

    case 'faker_first_name':
      return faker.person.firstName();

    case 'faker_last_name':
      return faker.person.lastName();

    case 'faker_email':
      return faker.internet.email().toLowerCase();

    case 'faker_phone':
      return faker.phone.number();

    case 'faker_company':
      return faker.company.name();

    case 'faker_job':
      return faker.person.jobTitle();

    case 'faker_city':
      return faker.location.city();

    case 'faker_country':
      return faker.location.country();

    case 'faker_sentence':
      return faker.lorem.sentence({ min: 4, max: 10 });

    case 'faker_paragraph':
      return faker.lorem.paragraph({ min: 2, max: 4 });

    case 'faker_number': {
      const min = Number(rule.numberMin ?? 1);
      const max = Number(rule.numberMax ?? 100);
      return String(faker.number.int({ min, max }));
    }

    case 'faker_date': {
      const date = faker.date.recent({ days: 30 });
      return date.toISOString().split('T')[0];
    }

    case 'faker_time': {
      const hour = String(faker.number.int({ min: 0, max: 23 })).padStart(2, '0');
      const min = String(faker.number.int({ min: 0, max: 59 })).padStart(2, '0');
      return `${hour}:${min}`;
    }

    case 'scale_rating': {
      const min = question.scaleMin ?? 1;
      const max = question.scaleMax ?? 5;
      const val = rule.scaleValue ? Number(rule.scaleValue) : Math.floor(Math.random() * (max - min + 1)) + min;
      return String(Math.min(Math.max(val, min), max));
    }

    default:
      if (question.options?.length > 0) {
        return question.options[0];
      }
      return faker.word.words(2);
  }
}

/**
 * Builds complete payload of entry key-values for a form
 */
function buildSubmissionPayload(questions, rulesMap, index = 1, csvRow = null) {
  const payload = {};

  for (const question of questions) {
    const rule = rulesMap[question.id] || {};
    // Skip optional fields if rule specifically says skip
    if (rule.skip && !question.required) {
      continue;
    }

    const value = generateFieldValue(question, rule, index, csvRow);

    if (Array.isArray(value)) {
      // Checkbox multiple values
      payload[question.id] = value;
    } else if (question.type === 'date' && typeof value === 'string' && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        payload[`${question.id}_year`] = parts[0];
        payload[`${question.id}_month`] = String(Number(parts[1]));
        payload[`${question.id}_day`] = String(Number(parts[2]));
        payload[question.id] = value;
      } else {
        payload[question.id] = value;
      }
    } else if (question.type === 'time' && typeof value === 'string' && value.includes(':')) {
      const parts = value.split(':');
      if (parts.length >= 2) {
        payload[`${question.id}_hour`] = parts[0];
        payload[`${question.id}_minute`] = parts[1];
        payload[question.id] = value;
      } else {
        payload[question.id] = value;
      }
    } else {
      payload[question.id] = String(value ?? '');
    }
  }

  return payload;
}

module.exports = {
  generateFieldValue,
  buildSubmissionPayload
};

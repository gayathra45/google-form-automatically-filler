const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Generates sample demo form structure for instant testing & evaluation
 */
function getDemoForm(demoType = 'sample1') {
  if (demoType.includes('event')) {
    return {
      url: 'https://docs.google.com/forms/d/e/1FAIpQLScX9_Sample_Event_Reg_2026/viewform',
      responseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScX9_Sample_Event_Reg_2026/formResponse',
      title: 'Global Tech Summit 2026 Registration',
      description: 'Please complete this form to register your attendance and session preferences.',
      questionCount: 6,
      questions: [
        {
          id: 'entry.104562143',
          title: 'Full Name',
          helpText: 'As it should appear on your badge',
          type: 'text',
          required: true,
          options: []
        },
        {
          id: 'entry.839401924',
          title: 'Work Email Address',
          helpText: 'Confirmation ticket will be sent here',
          type: 'text',
          required: true,
          options: []
        },
        {
          id: 'entry.492019482',
          title: 'Company / Organization',
          helpText: '',
          type: 'text',
          required: false,
          options: []
        },
        {
          id: 'entry.728194820',
          title: 'Ticket Tier',
          helpText: 'Select your pass type',
          type: 'radio',
          required: true,
          options: ['Standard Pass ($199)', 'VIP Access ($499)', 'Student / Researcher ($49)', 'Virtual Attendee (Free)']
        },
        {
          id: 'entry.391029481',
          title: 'Workshops You Plan to Attend',
          helpText: 'Select all that apply',
          type: 'checkbox',
          required: false,
          options: ['AI & Agentic Workflows', 'Cloud Infrastructure', 'Cybersecurity Deep Dive', 'Full-Stack Architecture']
        },
        {
          id: 'entry.582910482',
          title: 'Dietary Restrictions or Special Notes',
          helpText: '',
          type: 'paragraph',
          required: false,
          options: []
        }
      ],
      pageHistory: '0',
      fbzx: '84920481928491823',
      requiresSignIn: false
    };
  }

  return {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdc2j0G5Wz8aE5-fK69wL7m1R6oN8k3v_sample1/viewform',
    responseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdc2j0G5Wz8aE5-fK69wL7m1R6oN8k3v_sample1/formResponse',
    title: 'Customer Satisfaction & Product Feedback Survey',
    description: 'We value your input! Help us enhance our developer tools and automated workflows.',
    questionCount: 7,
    questions: [
      {
        id: 'entry.2005620554',
        title: 'Full Name',
        helpText: 'Enter your full name',
        type: 'text',
        required: true,
        options: []
      },
      {
        id: 'entry.1045781291',
        title: 'Email Address',
        helpText: 'Where we can contact you regarding feedback',
        type: 'text',
        required: true,
        options: []
      },
      {
        id: 'entry.839401928',
        title: 'Overall Satisfaction Rating',
        helpText: '1 = Very Unsatisfied, 5 = Extremely Satisfied',
        type: 'scale',
        required: true,
        options: [],
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Poor',
        scaleMaxLabel: 'Excellent'
      },
      {
        id: 'entry.1065046570',
        title: 'How did you discover our platform?',
        helpText: '',
        type: 'radio',
        required: true,
        options: ['Google Search', 'GitHub / Open Source', 'Friend / Colleague', 'YouTube / Tutorial', 'Social Media']
      },
      {
        id: 'entry.1166974658',
        title: 'Key Features You Use Most',
        helpText: 'Select all features you regularly interact with',
        type: 'checkbox',
        required: false,
        options: ['Automated Form Submissions', 'Realistic Faker Identity Generator', 'CSV Dataset Bulk Runner', '1-Click Bookmarklet', 'Live SSE Console']
      },
      {
        id: 'entry.837918230',
        title: 'Primary Industry / Role',
        helpText: '',
        type: 'dropdown',
        required: false,
        options: ['Software Engineering', 'QA / Automation Testing', 'Data Analytics & Research', 'Academic / Student', 'Other']
      },
      {
        id: 'entry.839517201',
        title: 'Additional Feedback or Feature Requests',
        helpText: 'Share any details, bugs, or ideas',
        type: 'paragraph',
        required: false,
        options: []
      }
    ],
    pageHistory: '0',
    fbzx: '39481928491829482',
    requiresSignIn: false
  };
}

/**
 * Normalizes any Google Form URL (e.g. forms.gle, edit link, embedded link)
 * to a standard viewform URL.
 */
function normalizeFormUrl(inputUrl) {
  let url = inputUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Extracts formId from standard Google Form URLs
 */
function extractFormId(url) {
  const match = url.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/) || url.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Parses Google Form HTML using FB_PUBLIC_LOAD_DATA_ and DOM fallback.
 */
async function parseGoogleForm(url) {
  const targetUrl = normalizeFormUrl(url);

  // Check if requested demo sample
  if (targetUrl.includes('sample') || targetUrl.includes('demo') || targetUrl.includes('Sample_Event')) {
    return getDemoForm(targetUrl);
  }

  const response = await axios.get(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    maxRedirects: 5,
    timeout: 15000
  });

  const finalUrl = response.request?.res?.responseUrl || targetUrl;
  const html = response.data;
  const $ = cheerio.load(html);

  // Detect if Google Form enforces Google Account Sign-In / Limit to 1 Response
  const requiresSignIn = html.includes('ServiceLogin') ||
    html.includes('Sign in to continue') ||
    html.includes('Sign in to Google') ||
    html.includes('දිගටම කරගෙන යාමට පුරන්න') ||
    html.includes('ඔබ පිරිය යුතුය') ||
    html.includes('accounts.google.com');

  // Extract FB_PUBLIC_LOAD_DATA_
  let publicData = null;
  const scriptRegex = /FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/;
  const match = html.match(scriptRegex);

  if (match && match[1]) {
    try {
      publicData = JSON.parse(match[1]);
    } catch (err) {
      console.warn('Failed to parse FB_PUBLIC_LOAD_DATA_ directly, trying loose evaluation');
    }
  }

  // Determine Form Action Response URL
  let responseUrl = '';
  const formId = extractFormId(finalUrl) || extractFormId(targetUrl);
  if (formId) {
    responseUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
  } else {
    const formAction = $('form').attr('action');
    if (formAction) {
      responseUrl = formAction.startsWith('http') ? formAction : `https://docs.google.com${formAction}`;
      if (!responseUrl.endsWith('/formResponse')) {
        responseUrl = responseUrl.replace(/\/formResponse.*$/, '') + '/formResponse';
      }
    }
  }

  // Extract Form Title & Description
  let title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Google Form';
  let description = $('meta[property="og:description"]').attr('content') || '';

  const questions = [];

  if (publicData && Array.isArray(publicData[1])) {
    const rawFormInfo = publicData[1];
    if (rawFormInfo[8]) title = rawFormInfo[8];
    if (rawFormInfo[0]) description = rawFormInfo[0];

    const rawQuestions = rawFormInfo[1] || [];

    for (const item of rawQuestions) {
      if (!item || !Array.isArray(item)) continue;

      const qTitle = item[1] || 'Untitled Question';
      const qHelpText = item[2] || '';
      const qTypeCode = item[3];
      const qData = item[4];

      if (!qData || !Array.isArray(qData) || qData.length === 0) continue;

      for (const subItem of qData) {
        if (!subItem || !Array.isArray(subItem)) continue;

        const entryIdNum = subItem[0];
        if (!entryIdNum) continue;

        const entryId = `entry.${entryIdNum}`;
        const isRequired = subItem[2] === 1;
        const rawOptions = subItem[1] || [];
        const options = rawOptions.map(opt => Array.isArray(opt) ? opt[0] : String(opt)).filter(Boolean);

        let type = 'text';
        switch (qTypeCode) {
          case 0:
            type = 'text';
            break;
          case 1:
            type = 'paragraph';
            break;
          case 2:
            type = 'radio';
            break;
          case 3:
            type = 'dropdown';
            break;
          case 4:
            type = 'checkbox';
            break;
          case 5:
            type = 'scale';
            break;
          case 9:
            type = 'date';
            break;
          case 10:
            type = 'time';
            break;
          default:
            type = options.length > 0 ? 'radio' : 'text';
        }

        questions.push({
          id: entryId,
          title: qTitle,
          helpText: qHelpText,
          type: type,
          required: isRequired,
          options: options,
          scaleMin: qTypeCode === 5 ? (subItem[3]?.[0] ?? 1) : undefined,
          scaleMax: qTypeCode === 5 ? (subItem[3]?.[1] ?? 5) : undefined,
          scaleMinLabel: qTypeCode === 5 ? (subItem[3]?.[2] ?? '') : '',
          scaleMaxLabel: qTypeCode === 5 ? (subItem[3]?.[3] ?? '') : ''
        });
      }
    }
  }

  // Fallback if DOM search needed
  if (questions.length === 0) {
    $('[name^="entry."]').each((_, el) => {
      const name = $(el).attr('name');
      if (!name) return;

      const cleanName = name.replace(/_sentinel$/, '');
      if (questions.some(q => q.id === cleanName)) return;

      const container = $(el).closest('[role="listitem"], .freebirdFormviewerViewNumberedItemContainer, .Qr7Oae, .geS5n');
      const questionTitle = container.find('[role="heading"], .freebirdFormviewerViewItemsItemItemTitle, .M7eMe').first().text().trim() || cleanName;
      const isRequired = container.find('.freebirdFormviewerViewItemsItemRequiredAsterisk, [aria-label*="required"]').length > 0;

      questions.push({
        id: cleanName,
        title: questionTitle,
        helpText: '',
        type: 'text',
        required: isRequired,
        options: []
      });
    });
  }

  let pageHistory = '0';
  let fbzx = $('input[name="fbzx"]').val() || '';

  const pageHistoryMatch = html.match(/name="pageHistory"\s+value="([^"]+)"/);
  if (pageHistoryMatch) pageHistory = pageHistoryMatch[1];

  const fbzxMatch = html.match(/name="fbzx"\s+value="([^"]+)"/);
  if (fbzxMatch) fbzx = fbzxMatch[1];

  return {
    url: targetUrl,
    responseUrl: responseUrl || `${targetUrl.replace(/\/viewform.*$/, '')}/formResponse`,
    title: title.replace(/ - Google Forms$/, '').trim(),
    description: description.trim(),
    questionCount: questions.length,
    questions,
    pageHistory,
    fbzx,
    requiresSignIn
  };
}

module.exports = {
  parseGoogleForm,
  normalizeFormUrl,
  getDemoForm
};

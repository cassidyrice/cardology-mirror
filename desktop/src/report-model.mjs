import {buildProfessionalReading} from '../../scripts/professional-reading/builder.ts';
import {renderReport} from '../../scripts/professional-reading/render.ts';

export const DRAFT_FORMAT = 'card-blueprints-report';
export const MAX_NOTES = 12000;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// A draft contains inputs only. Never trust imported HTML or calculated cards.
export function readDraft(value) {
  if (!value || value.format !== DRAFT_FORMAT || value.version !== 1) throw Error('Choose a Card Blueprints report draft (version 1).');
  for (const [key, max] of [['name',60],['birthdate',10],['readingDate',10],['notes',MAX_NOTES]]) {
    if (typeof value[key] !== 'string' || value[key].length > max) throw Error(`Invalid draft field: ${key}.`);
  }
  if (typeof value.includeNotes !== 'boolean') throw Error('Invalid draft notes setting.');
  return {format:DRAFT_FORMAT, version:1, name:value.name, birthdate:value.birthdate, readingDate:value.readingDate, notes:value.notes, includeNotes:value.includeNotes};
}

export function createDraft(fields) {
  return readDraft({format:DRAFT_FORMAT,version:1,...fields});
}

export function buildDocument(fields) {
  const draft = createDraft(fields);
  const report = buildProfessionalReading(draft.name.trim(), draft.birthdate, draft.readingDate);
  let html = renderReport(report);
  // Plain text only; short, bounded lines keep notes away from printed footers.
  if (draft.includeNotes && draft.notes.trim()) {
    const lines = [];
    for (const paragraph of draft.notes.replace(/\r\n?/g,'\n').split('\n')) {
      let rest = paragraph;
      while (rest.length > 70) {
        const space = rest.lastIndexOf(' ',70);
        const split = space > 25 ? space : 70;
        lines.push(rest.slice(0,split));
        rest = rest.slice(split).trimStart();
      }
      lines.push(rest);
    }
    const existing = (html.match(/<section class="page"/g) || []).length;
    let pages = '';
    for (let offset=0; offset<lines.length; offset+=24) {
      const number = existing + Math.floor(offset/24) + 1;
      pages += `<section class="page reader-notes" id="reader-notes-${number}"><header><span>CARD BLUEPRINTS / PRIVATE READING</span><span>+ ${String(number).padStart(2,'0')} +</span></header><h2>Reader notes${offset ? ' / continued' : ''}</h2><p class="eyebrow">Personal observations from your reader</p><div class="reader-copy">${lines.slice(offset,offset+24).map(line=>`<div>${escape(line) || '&nbsp;'}</div>`).join('')}</div><footer>Cards are coordinates. You choose the meaning.</footer></section>`;
    }
    html = html.replace('</main>',`${pages}</main>`);
  }
  html = html.replace('</style>', '.reader-copy{font-size:14px;line-height:1.65;overflow-wrap:anywhere}.reader-copy>div{min-height:1.65em}@media print{.reader-copy{font-size:13px}} </style>');
  return {draft,report,html};
}

export function fileStem(draft) {
  const name = draft.name.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50) || 'client';
  return `card-blueprints-${name.toLowerCase()}-${draft.readingDate || 'draft'}`;
}

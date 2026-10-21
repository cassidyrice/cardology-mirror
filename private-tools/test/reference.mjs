import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {root, bundleOptions} from '../build.mjs';

export async function prepareReference() {
  await mkdir(`${root}/.test-build`, {recursive: true});
  await build({...bundleOptions, absWorkingDir: root, stdin: {contents: "export {calculate} from '../desktop/src/engine.mjs'; export {OFFERS,buildDocument,buildEngineData,readDraft} from '../desktop/src/offer-model.mjs'; export {renderOfferReport} from '../desktop/src/offer-render.mjs'; export {buildDocument as buildHostedDocument} from './src/reports.mjs'; export {buildBirthCardBlueprint,parseBirthday,birthCardFor,rulingCardsFor} from '../desktop/src/birth-card-blueprint.mjs'; export {calculateBirthCard} from '../lib/birth-card-calculator.ts';", resolveDir: root}, platform: 'node', format: 'esm', outfile: `${root}/.test-build/reference.mjs`});
}

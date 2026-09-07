# Uniqueness-gate exceptions

`seo-pages/scripts/uniqueness-audit.ts` reports these pages as failing residual
similarity. As of 2026-09-06 there are 158 of them, across 2,988 pack pages and
954 nobel pages. They are accepted, not fixed, for one reason: **each pair shares a
birth card**, so the two pages carry the same fixed path — the same karma cards,
the same Life Spread row of nine, the same planetary ruling card. That block is
card-derived, not person-derived, and shortening it further would mean dropping
the cards themselves.

Approved by Cass on 2026-09-06, after two measured alternatives:
dropping the archetype names from the Life Spread lines (done — this list is the
result, down from 423) and dropping the fixed-path block entirely (rejected).

Every failure below is `residual similarity > 30%`. No page fails on unique-word
count, title, meta description or any E-E-A-T signal.

Regenerate: `bun seo-pages/scripts/uniqueness-audit.ts seo-pages/<dist> <prefix> --report-only`.

## emmys — 2 pages

| page | most similar to | shared birth card | residual |
|---|---|---|---|
| kelsey-grammer | bruce-willis | 4♦ | 32% |

## kennedy-center-honors — 25 pages

| page | most similar to | shared birth card | residual |
|---|---|---|---|
| arturo-sandoval | sally-field | A♦ | 35% |
| shirley-temple-black | jerome-robbins | J♣ | 35% |
| roger-l-stevens | edward-albee | J♦ | 35% |
| helen-hayes | johnny-cash | Q♣ | 33% |
| lynn-fontanne | dave-brubeck | Q♣ | 33% |
| james-taylor | edward-albee | J♦ | 32% |
| roy-acuff | jessye-norman | 9♣ | 31% |
| aretha-franklin | jerome-robbins | J♣ | 31% |
| ray-charles | wayne-shorter | A♣ | 31% |
| gloria-estefan | barry-gibb | 10♦ | 31% |
| yehudi-menuhin | helen-hayes | Q♣ | 31% |
| ginger-rogers | helen-hayes | Q♣ | 30% |
| sean-connery | wayne-shorter | A♣ | 30% |
| debbie-allen | marilyn-horne | J♦ | 30% |
| philip-bailey | ralph-johnson | J♦ | 30% |

## nfl-hof — 30 pages

| page | most similar to | shared birth card | residual |
|---|---|---|---|
| barry-sanders | ron-yary | Q♣ | 39% |
| lee-roy-selmon | rosey-brown | 2♣ | 38% |
| troy-aikman | michael-strahan | Q♥ | 38% |
| rod-woodson | ron-mix | K♦ | 37% |
| reggie-white | warren-sapp | Q♥ | 36% |
| curley-culp | ron-mix | K♦ | 33% |
| derrick-brooks | thurman-thomas | 3♦ | 32% |
| andre-reed | tony-gonzalez | J♣ | 32% |
| joe-guyon | art-shell | 7♥ | 32% |
| john-madden | doug-atkins | J♦ | 32% |
| brett-favre | leroy-kelly | Q♣ | 32% |
| sid-luckman | jim-ringo | Q♥ | 31% |
| dick-stanfel | dan-rooney | 8♣ | 31% |
| billy-shaw | nick-buoniconti | 3♣ | 31% |
| aeneas-williams | andre-reed | J♣ | 31% |
| willie-roaf | derrick-brooks | 3♦ | 31% |
| clarke-hinkle | john-madden | J♦ | 30% |

## nobel — 8 pages

| page | most similar to | shared birth card | residual |
|---|---|---|---|
| charles-h-townes | pavel-a-cherenkov | K♥ | 33% |
| jeffrey-c-hall | michael-rosbash | 3♠ | 32% |
| steven-chu | leon-n-cooper | 10♣ | 32% |
| james-e-rothman | georges-j-f-kohler | 4♦ | 31% |

## olympics/summer — 61 pages

| page | most similar to | shared birth card | residual |
|---|---|---|---|
| ilona-richter | gabriele-kuhn | Q♦ | 49% |
| lawrence-nuesslein | lloyd-spooner | 3♦ | 47% |
| emil-rausch | ulrike-richter | K♣ | 46% |
| dieter-schubert | emil-rausch | K♣ | 41% |
| rudolf-karpati | pal-kovacs | J♣ | 40% |
| liane-buhr | ilona-richter | Q♦ | 40% |
| angel-martino | jon-olsen | 9♣ | 40% |
| susan-pedersen | melissa-belote | 6♣ | 39% |
| zhang-ning | ge-fei | K♣ | 37% |
| albert-helgerud | guo-wenjun | 8♣ | 36% |
| rebecca-adlington | rowdy-gaines | 8♦ | 35% |
| ruth-fuchs | ake-lundeberg | 4♣ | 35% |
| viktor-zhdanovich | oskari-friman | K♣ | 35% |
| ines-diers | axel-norling | 5♦ | 35% |
| edward-hennig | mark-arie | 9♣ | 35% |
| carl-westergren | edward-hennig | 9♣ | 34% |
| daniela-hunger | dieter-grahn | 3♦ | 33% |
| ernst-hoppenberg | istvan-pelle | 2♣ | 32% |
| laurence-doherty | valery-rezantsev | A♦ | 32% |
| jimmy-mclane | nelson-diebel | J♣ | 32% |
| nathan-adrian | jimmy-mclane | J♣ | 32% |
| rudiger-helm | lloyd-spooner | 3♦ | 31% |
| charles-vinci | marina-wilke | 10♣ | 31% |
| vladimir-artemov | gabby-thomas | J♣ | 31% |
| mark-spitz | ethel-lackie | 2♠ | 31% |
| yui-ohashi | svetlana-kolesnichenko | 4♣ | 31% |
| cate-campbell | crissy-ahmann-leighton | Q♣ | 31% |
| andreas-hajek | ines-diers | 5♦ | 31% |
| heike-friedrich | daniela-hunger | 3♦ | 31% |
| lars-hall | yui-ohashi | 4♣ | 30% |
| baldo-baldi | ma-lin | 6♦ | 30% |
| li-xiaoxia | wang-qianyi | J♦ | 30% |
| danyon-loader | ulrike-richter | K♣ | 30% |
| teddy-riner | stefan-semmler | A♠ | 30% |
| dmitri-sautin | levan-tediashvili | 8♦ | 30% |

## pulitzer/fiction — 7 pages

| page | most similar to | shared birth card | residual |
|---|---|---|---|
| n-scott-momaday | john-steinbeck | J♣ | 32% |
| edwin-o-connor | booth-tarkington | Q♥ | 32% |
| josephine-winslow-johnson | john-phillips-marquand | 10♣ | 31% |
| robert-penn-warren | josephine-winslow-johnson | 10♣ | 30% |

## rock-hall — 12 pages

| page | most similar to | shared birth card | residual |
|---|---|---|---|
| sam-cooke | steven-adler | 5♦ | 34% |
| marlon-jackson | steve-harris | J♦ | 32% |
| tom-johnston | bobby-byrd | J♣ | 32% |
| martin-gore | dino-danelli | 5♣ | 32% |
| thom-yorke | jonny-greenwood | 2♦ | 32% |
| ian-stewart | martha-reeves | 10♣ | 31% |

## tonys — 13 pages

| page | most similar to | shared birth card | residual |
|---|---|---|---|
| michael-crawford | fritz-weaver | 8♦ | 41% |
| david-wayne | tammy-grimes | 10♣ | 38% |
| tommy-tune | zero-mostel | 10♣ | 38% |
| anthony-lapaglia | carol-channing | 9♣ | 31% |
| hal-holbrook | alan-bates | 8♦ | 31% |
| joaquina-kalukango | joshua-henry | 9♦ | 30% |
| mercedes-ruehl | tommy-tune | 10♣ | 30% |


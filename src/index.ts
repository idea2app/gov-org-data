import 'array-unique-proposal';
import { promises } from 'fs';
import { JSDOM } from 'jsdom';
import { parse } from 'path';
import { stringify } from 'yaml';
import yargs from 'yargs';

const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0[options]')
    .options('urls', {
        alias: 'u',
        describe: 'A list of URLs to scrape',
        type: 'array',
        demandOption: true,
    })
    .option('output', {
        alias: 'o',
        describe: 'Output file path(e.g., data.json, data.yml, data.csv)',
        type: 'string',
        default: 'data.json',
    }).argv;

const { urls, output } = argv;

console.time(output);

interface Job extends Record<'positions' | 'vacancies' | 'applicants', number> {
    name: string;
}

const promiseList = urls.map(async (uri) => {
    const {
        window: { document },
    } = await JSDOM.fromURL(uri);

    return [...document.querySelectorAll('.searchList > li > a')]
        .map(({ children }) => {
            const [name, counts] = [...children];

            const orgName = name.textContent?.trim().replace(/（.+?）/g, '');
            const [positions, vacancies, applicants] =
                counts.textContent?.match(/\d+/g)?.map(Number) || [];

            return (
                !orgName?.includes('所属事业单位') && {
                    name: orgName,
                    positions,
                    vacancies,
                    applicants,
                }
            );
        })
        .filter(Boolean) as Job[];
});

const list = await Promise.all(promiseList);

const data = (list.flat(Infinity) as Job[]).uniqueBy('name');

const { ext } = parse(output);

const text =
    ext === '.json'
        ? JSON.stringify(data, null, 4)
        : /^\.ya?ml$/.test(ext)
        ? stringify(data)
        : ext === '.csv'
        ? [
              Object.keys(data[0]) + '',
              ...data.map(
                  (item) =>
                      Object.values(item).map((value) =>
                          JSON.stringify(value),
                      ) + '',
              ),
          ].join('\n')
        : '';

await promises.writeFile(output, text);

console.log(data.length + '条记录，成功写入完成');
console.timeEnd(output);

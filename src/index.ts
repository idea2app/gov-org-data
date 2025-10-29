import 'array-unique-proposal';
import { outputFile } from 'fs-extra';
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

async function* loadList(links: string[]): AsyncGenerator<Job> {
    for (const link of links) {
        const {
            window: { document },
        } = await JSDOM.fromURL(link);

        for (const { children } of document.querySelectorAll('.searchList > li > a')) {
            const [name, counts] = children;

            const orgName = name.textContent?.trim().replace(/（.+?）/g, '');
            const [positions, vacancies, applicants] =
                counts.textContent?.match(/\d+/g)?.map(Number) || [];

            if (!orgName?.includes('所属事业单位'))
                yield { name: orgName, positions, vacancies, applicants };
        }
    }
}
const list = await Array.fromAsync(loadList(urls as string[]));

const data = list.uniqueBy('name');

const { ext } = parse(output);

const stringifyCSV = (data: object[]) =>
    [
        Object.keys(data[0]) + '',
        ...data.map((item) => Object.values(item).map((value) => JSON.stringify(value)) + ''),
    ].join('\n');

const text =
    ext === '.json'
        ? JSON.stringify(data, null, 4)
        : /^\.ya?ml$/.test(ext)
          ? stringify(data)
          : ext === '.csv'
            ? stringifyCSV(data)
            : '';

await outputFile(output, text);

console.log(data.length + '条记录，成功写入完成');
console.timeEnd(output);

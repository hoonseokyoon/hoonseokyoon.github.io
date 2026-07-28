import personRaw from './person.yml?raw';
import { parseCatalog } from './parse';

const timelineModules = import.meta.glob('./timeline/*.yml', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;
const projectModules = import.meta.glob('./projects/*.yml', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;
const outputModules = import.meta.glob('./outputs/*.yml', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

export const catalog = parseCatalog(
  personRaw,
  Object.entries(timelineModules),
  Object.entries(projectModules),
  Object.entries(outputModules)
);

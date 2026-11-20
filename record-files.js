'use strict';

const interviewFilePrefix = 'interview-';
const interviewFileFormat = 'app-uiux-interview/v1';
const recordIdPattern = /^[a-z0-9-]+$/i;
const assessmentIdPattern = /^E\d+$/;
const recordFilename = id => `${interviewFilePrefix}${id}.json`;

function isTextMap(value, keys) {
  return Boolean(value) && keys.every(key => typeof value[key] === 'string');
}

function isInterviewRecord(record) {
  return Boolean(record)
    && typeof record.id === 'string' && recordIdPattern.test(record.id)
    && isTextMap(record.basic, ['name', 'date'])
    && isTextMap(record.summary, ['traits', 'teamFit'])
    && (record.legacy === undefined || (Array.isArray(record.legacy)
      && record.legacy.every(field => isTextMap(field, ['label', 'value']))))
    && Array.isArray(record.items)
    && record.items.every(item => isTextMap(item, ['id', 'title', 'criteria', 'score', 'example'])
      && assessmentIdPattern.test(item.id) && ['', '1', '2', '3', 'pending'].includes(item.score))
    && new Set(record.items.map(item => item.id)).size === record.items.length
    && typeof record.notes === 'string'
    && typeof record.updatedAt === 'string';
}

async function readInterviewFiles(folder) {
  const entries = [];
  let unreadable = 0;
  for await (const file of folder.values()) {
    if (file.kind !== 'file' || !file.name.startsWith(interviewFilePrefix) || !file.name.endsWith('.json')) continue;
    try {
      const parsed = JSON.parse(await (await file.getFile()).text());
      if (parsed?.format !== interviewFileFormat || !isInterviewRecord(parsed.record)) {
        unreadable += 1;
        continue;
      }
      entries.push({ record: parsed.record, file, folder });
    } catch {
      unreadable += 1;
    }
  }
  return { entries, unreadable };
}

async function writeInterviewFile(folder, record, existingFile) {
  const filename = recordFilename(record.id);
  let file = existingFile;
  let created = false;
  let writable;
  if (!file) {
    try {
      await folder.getFileHandle(filename);
      throw new DOMException('An interview with this filename already exists.', 'InvalidModificationError');
    } catch (error) {
      if (error.name !== 'NotFoundError') throw error;
    }
    file = await folder.getFileHandle(filename, { create: true });
    created = true;
  }

  try {
    writable = await file.createWritable();
    await writable.write(JSON.stringify({ format: interviewFileFormat, record }, null, 2) + '\n');
    await writable.close();
    return file;
  } catch (error) {
    if (writable) await writable.abort().catch(() => {});
    if (created) {
      try {
        const current = await folder.getFileHandle(filename);
        if (await file.isSameEntry(current) && (await current.getFile()).size === 0) {
          await folder.removeEntry(filename);
        }
      } catch { /* Leave the file untouched if it cannot be checked. */ }
    }
    throw error;
  }
}

/**
 * YCW Transformer
 *
 * Перетворює відповіді YouControl API на структуровані об'єкти.
 * Принцип: не фільтруємо і не ховаємо дані — лише прибираємо
 * технічний мотлох (_key, _rev, _from, _to, uids) та структуруємо.
 *
 * Для entity є два режими:
 *  - "duplicate" — items залишаються окремо по датасетах (всі поля видно)
 *  - "merge"     — items злиті в один об'єкт (всі значення зібрані в масиви)
 */

// ─── Типи ────────────────────────────────────────────────────────────────────

export type TransformMode = 'merge' | 'duplicate';

export interface YcwItemDuplicate {
  dataSetId: string;
  id: string;
  schema: string;
  caption: string | null;
  isPep: boolean;
  isSanctioned: boolean;
  createdOn: string | null;
  modifiedOn: string | null;
  properties: Record<string, string[]>;
  passports: unknown[];
  identifications: unknown[];
  taxRolls: unknown[];
  sanctions: unknown[];
}

export interface YcwItemMerged {
  ids: string[];
  dataSets: string[];
  schema: string;
  captions: string[];
  isPep: boolean;
  isSanctioned: boolean;
  properties: Record<string, string[]>; // всі значення з усіх датасетів, унікальні
}

export interface YcwRelation {
  type: string; // Directorship / Ownership / Family / Employment / etc.
  role: string[];
  relationship: string[];
  startDate: string | null;
  endDate: string | null;
  entity: YcwItemDuplicate[] | YcwItemMerged; // залежить від mode
}

export interface YcwRelationGroup {
  type: string;
  total: number;
  items: YcwRelation[];
}

export interface YcwSearchItem {
  externalId: string;
  items: YcwItemDuplicate[];
}

export interface YcwSearchResponse {
  total: number;
  results: YcwSearchItem[];
  aggregations: {
    raw: Record<string, unknown>[]; // оригінал з API
    grouped: Record<string, unknown>; // згрупований варіант
  };
}

export interface YcwEntityResponse {
  internalId: string;
  relationsCount: { schema: string; count: number }[];
  items: YcwItemDuplicate[] | YcwItemMerged;
  relations: YcwRelationGroup[];
}

// ─── Хелпери ─────────────────────────────────────────────────────────────────

/** Видаляє технічні поля ArangoDB з об'єкта */
function stripInternal<T extends Record<string, unknown>>(
  obj: T,
): Omit<T, '_key' | '_rev' | '_from' | '_to' | 'uids' | '_id'> {
  const { _key, _rev, _from, _to, uids, _id, ...rest } = obj as any;
  return rest;
}

/** Повертає унікальні непорожні рядки */
function uniq(arr: unknown[]): string[] {
  return [...new Set(arr.filter((v) => v != null && v !== '').map(String))];
}

/** Конвертує boolean або рядок "true"/"false" */
function toBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true';
  return false;
}

/** Нормалізує один item з API в YcwItemDuplicate */
function normalizeItem(item: any): YcwItemDuplicate {
  const props: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(item.properties ?? {})) {
    if (Array.isArray(val)) {
      props[key] = uniq(val);
    }
  }

  return {
    dataSetId: item.dataSetId ?? null,
    id: item.id ?? null,
    schema: item.schema ?? null,
    caption: item.caption ?? null,
    isPep: toBool(item.isPep),
    isSanctioned: Array.isArray(item.sanctions) && item.sanctions.length > 0,
    createdOn: item.createdOn ?? null,
    modifiedOn: item.modifiedOn ?? null,
    properties: props,
    passports: item.passports ?? [],
    identifications: item.identifications ?? [],
    taxRolls: item.taxRolls ?? [],
    sanctions: item.sanctions ?? [],
  };
}

/** Мержить масив items в один об'єкт — всі значення зібрані разом */
function mergeItems(items: any[]): YcwItemMerged {
  const mergedProps: Record<string, string[]> = {};
  const ids: string[] = [];
  const dataSets: string[] = [];
  const captions: string[] = [];
  let isPep = false;
  let isSanctioned = false;

  for (const item of items) {
    if (item.id) ids.push(item.id);
    if (item.dataSetId) dataSets.push(item.dataSetId);
    if (item.caption) captions.push(item.caption);
    if (toBool(item.isPep)) isPep = true;
    if (Array.isArray(item.sanctions) && item.sanctions.length > 0)
      isSanctioned = true;

    for (const [key, val] of Object.entries(item.properties ?? {})) {
      if (!mergedProps[key]) mergedProps[key] = [];
      if (Array.isArray(val)) mergedProps[key].push(...val.map(String));
    }
  }

  // дедуплікація
  for (const key of Object.keys(mergedProps)) {
    mergedProps[key] = uniq(mergedProps[key]);
  }

  return {
    ids: uniq(ids),
    dataSets: uniq(dataSets),
    schema: items[0]?.schema ?? null,
    captions: uniq(captions),
    isPep,
    isSanctioned,
    properties: mergedProps,
  };
}

/** Нормалізує тип зв'язку — прибирає Super-префікс */
function normalizeRelationType(schema: string): string {
  return schema?.replace(/^Super/, '') ?? 'Unknown';
}

/** Трансформує один зв'язок з relationsData */
function normalizeRelation(rel: any, mode: TransformMode): YcwRelation {
  const rdItems: any[] = rel.relationData?.items ?? [];
  const entityItems: any[] = rel.items ?? [];

  // збираємо role/relationship з усіх items relationData
  const roles = uniq(rdItems.flatMap((i) => i.properties?.role ?? []));
  const relationships = uniq(
    rdItems.flatMap((i) => i.properties?.relationship ?? []),
  );
  const startDates = uniq(
    rdItems.flatMap((i) => i.properties?.startDate ?? []),
  );
  const endDates = uniq(rdItems.flatMap((i) => i.properties?.endDate ?? []));

  return {
    type: normalizeRelationType(rel.relationData?.schema ?? rel.schema),
    role: roles,
    relationship: relationships,
    startDate: startDates[0] ?? null,
    endDate: endDates[0] ?? null,
    entity:
      mode === 'merge'
        ? mergeItems(entityItems)
        : entityItems.map(normalizeItem),
  };
}

/** Групує агрегації з масиву в зручний об'єкт */
function groupAggregations(filters: any[]): Record<string, unknown> {
  const grouped: Record<string, unknown> = {};
  if (!Array.isArray(filters)) return grouped;

  for (const filter of filters) {
    for (const [key, val] of Object.entries(filter)) {
      // "countries_Aggregations" → "countries"
      const cleanKey = key.replace(/_Aggregations$/, '');
      if (Array.isArray(val) && val.length > 0) {
        // [{ua: 1}, {ru: 2}] → {ua: 1, ru: 2}
        grouped[cleanKey] = Object.assign({}, ...val);
      }
    }
  }

  return grouped;
}

// ─── Публічні методи трансформації ───────────────────────────────────────────

export class YcwTransformer {
  /**
   * Трансформує відповідь GET /GetEntities
   * Повертає структуровані результати + обидва варіанти агрегацій
   */
  static transformSearch(raw: any): YcwSearchResponse {
    const result = raw?.result ?? raw;

    const results: YcwSearchItem[] = (result.entities ?? []).map(
      (entity: any) => ({
        externalId: entity.externalId ?? '',
        items: (entity.items ?? []).map(normalizeItem),
      }),
    );

    const rawFilters: Record<string, unknown>[] =
      result.aggregationFilters ?? [];

    return {
      total: result.total ?? 0,
      results,
      aggregations: {
        raw: rawFilters,
        grouped: groupAggregations(rawFilters),
      },
    };
  }

  /**
   * Трансформує відповідь GET /Entity/{externalId}/get-entity
   * mode = 'duplicate' — items окремо по датасетах
   * mode = 'merge'     — items злиті в один об'єкт
   */
  static transformEntity(
    raw: any,
    mode: TransformMode = 'duplicate',
  ): YcwEntityResponse {
    const result = raw?.result ?? raw;
    const entityItems: any[] = result.items ?? [];

    // групуємо relations по типу
    const relationsMap = new Map<string, YcwRelation[]>();
    for (const rel of result.relationsData ?? []) {
      const type = normalizeRelationType(
        rel.relationData?.schema ?? rel.schema,
      );
      if (!relationsMap.has(type)) relationsMap.set(type, []);
      relationsMap.get(type)!.push(normalizeRelation(rel, mode));
    }

    const relations: YcwRelationGroup[] = [];
    for (const [type, items] of relationsMap.entries()) {
      relations.push({ type, total: items.length, items });
    }

    return {
      internalId: result._id ?? '',
      relationsCount: (result.relationsCount ?? []).map((rc: any) => ({
        schema: rc.schema,
        count: Number(rc.count),
      })),
      items:
        mode === 'merge'
          ? mergeItems(entityItems)
          : entityItems.map(normalizeItem),
      relations,
    };
  }

  /**
   * Трансформує відповідь Trace ендпоінтів
   * Прибирає тільки технічні поля, структуру не чіпаємо
   */
  static transformTrace(raw: any): unknown {
    const result = raw?.result ?? raw;
    return YcwTransformer.deepStrip(result);
  }

  /** Рекурсивно видаляє технічні поля з будь-якого об'єкта */
  static deepStrip(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(YcwTransformer.deepStrip);
    if (obj !== null && typeof obj === 'object') {
      const stripped = stripInternal(obj as Record<string, unknown>);
      return Object.fromEntries(
        Object.entries(stripped).map(([k, v]) => [
          k,
          YcwTransformer.deepStrip(v),
        ]),
      );
    }
    return obj;
  }
}

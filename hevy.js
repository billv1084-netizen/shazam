// Hevy API client. The phone talks to Hevy directly (Hevy allows it).
// The API key is saved only in this device's browser.

const BASE = 'https://api.hevyapp.com/v1';

export class Hevy {
  constructor(key) { this.key = key; }

  async req(path, opts = {}) {
    const res = await fetch(BASE + path, {
      ...opts,
      headers: { 'api-key': this.key, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    if (res.status === 401 || res.status === 403) throw new Error('Hevy did not accept the API key. Check it in Settings.');
    if (!res.ok) throw new Error(`Hevy error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  }

  user() { return this.req('/user/info'); }

  // Every workout that started on or after `day` (YYYY-MM-DD). Hevy lists newest first, 10 per page.
  async workoutsSince(day) {
    const out = [];
    for (let page = 1; page <= 200; page++) {
      const r = await this.req(`/workouts?page=${page}&pageSize=10`);
      const list = r.workouts || [];
      out.push(...list);
      const oldest = list[list.length - 1];
      if (!list.length || page >= (r.page_count || 1) || (oldest && oldest.start_time.slice(0, 10) < day)) break;
    }
    return out;
  }

  async routines() {
    const out = [];
    for (let page = 1; page <= 20; page++) {
      const r = await this.req(`/routines?page=${page}&pageSize=10`);
      out.push(...(r.routines || []));
      if (page >= (r.page_count || 1)) break;
    }
    return out;
  }

  async routine(id) { return (await this.req(`/routines/${id}`)).routine; }

  putRoutine(id, body) { return this.req(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(body) }); }
}

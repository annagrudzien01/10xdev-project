# Rytmik MVP – Schemat bazy danych (PostgreSQL)

## 1. Lista tabel

### 1.1 `levels`
| Kolumna           | Typ          | Ograniczenia                                                  |
|-------------------|-------------|---------------------------------------------------------------|
| id                | SMALLINT    | PRIMARY KEY, CHECK (id BETWEEN 1 AND 20)                      |
| seq_length        | SMALLINT    | NOT NULL CHECK (seq_length > 0)                               |
| tempo             | SMALLINT    | NOT NULL CHECK (tempo > 0)                                    |
| use_black_keys    | BOOLEAN     | NOT NULL DEFAULT FALSE                                        |
| description       | TEXT        |                                                               |
| created_at        | TIMESTAMPTZ | DEFAULT now() NOT NULL                                        |
| updated_at        | TIMESTAMPTZ |                                                               |

---

### 1.2 `sequence`
| Kolumna           | Typ         | Ograniczenia                                                   |
|-------------------|-------------|---------------------------------------------------------------|
| id                | SMALLINT    | PRIMARY KEY DEFAULT uuid_generate_v4    |
| sequence_begining | VARCHAR(128)| NOT NULL                                |
| sequence_end      | VARCHAR(32) | NOT NUL                                 |
| level_id          | SMALLINT    | NOT NULL REFERENCES levels(id) |
| created_at        | TIMESTAMPTZ | DEFAULT now() NOT NULL     |
| updated_at        |TIMESTAMPTZ |       |                                  

---

### 1.3 `child_profiles`
| Kolumna           | Typ          | Ograniczenia                                                                                                         |
|-------------------|-------------|----------------------------------------------------------------------------------------------------------------------|
| id                | UUID        | PRIMARY KEY DEFAULT uuid_generate_v4()                                                                               |
| parent_id         | UUID        | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE                                                                  |
| profile_name      | VARCHAR(32) | NOT NULL CHECK (profile_name ~ '^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$'), UNIQUE(parent_id, profile_name)                    |
| date_of_birth     | DATE        | NOT NULL                                                                                                             |
| current_level_id  | SMALLINT    | NOT NULL REFERENCES levels(id)                                       |
| last_played_at    | TIMESTAMPTZ |                                                                                                                      |
| total_score       | INTEGER     | NOT NULL DEFAULT 0                                                                                                   |
| created_at        | TIMESTAMPTZ | DEFAULT now() NOT NULL                                                                                               |
| updated_at        | TIMESTAMPTZ |                                                                                                                      |

> **Limit 10 profili na rodzica** – wymuszony funkcją `create_child_profile()` w PL/pgSQL lub częściowym indeksem:
> `CREATE UNIQUE INDEX one_parent_ten_profiles ON child_profiles(parent_id, id) WHERE (SELECT count(*) FROM child_profiles c WHERE c.parent_id = parent_id) >= 10;`

---

### 1.4 `sessions`
| Kolumna        | Typ          | Ograniczenia                                                     |
|----------------|-------------|------------------------------------------------------------------|
| id             | UUID        | PRIMARY KEY DEFAULT uuid_generate_v4()                            |
| child_id       | UUID        | NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE          |
| is_active      | BOOLEAN     | NOT NULL DEFAULT TRUE                                             |
| started_at     | TIMESTAMPTZ | DEFAULT now() NOT NULL                                            |
| ended_at       | TIMESTAMPTZ | NULLABLE                                                          |
| created_at     | TIMESTAMPTZ | DEFAULT now() NOT NULL                                            |
| updated_at     | TIMESTAMPTZ |                                                                   |

---

### 1.5 `task_results`
| Kolumna           | Typ          | Ograniczenia                                                                    |
|-------------------|-------------|---------------------------------------------------------------------------------|
| id                | UUID        | PRIMARY KEY DEFAULT uuid_generate_v4()                                          |
| child_id          | UUID        | NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE                        |
| level_id          | SMALLINT    | NOT NULL REFERENCES levels(id)                                                  |
| sequence_id    | UUID      | NOT NULL REFERENCES sequence(id)      |
| attempts_used     | SMALLINT    | NOT NULL CHECK (attempts_used BETWEEN 1 AND 3)                                  |
| score             | SMALLINT    | NOT NULL CHECK (score BETWEEN 0 AND 10)                                         |
| completed_at      | TIMESTAMPTZ | DEFAULT now() NOT NULL                                                         |
| created_at        | TIMESTAMPTZ | DEFAULT now() NOT NULL                                                         |
| updated_at        | TIMESTAMPTZ |                                                                                |

## 2. Relacje między tabelami
1. **auth.users → child_profiles** – 1:N (rodzic do profili dzieci).
2. **child_profiles → sessions** – 1:N (profil → sesje), ale max 1 aktywna.
3. **child_profiles → task_results** – 1:N.
4. **levels → task_results** – 1:N.

## 3. Indeksy
| Tabela        | Nazwa indeksu                 | Definicja / Kolumny                            |
|---------------|-------------------------------|------------------------------------------------|
| child_profiles| idx_child_parent              | (parent_id)                                    |
| sessions      | ux_active_session_per_child   | UNIQUE(child_id) WHERE is_active               |
| task_results  | ux_child_seed                 | UNIQUE(child_id, generator_seed)               |
| task_results  | idx_task_completed_at         | (completed_at)                                 |

## 4. Zasady PostgreSQL (RLS)
```sql
-- Aktywacja RLS
aLTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_results ENABLE ROW LEVEL SECURITY;

-- Polityka dla child_profiles
CREATE POLICY child_profiles_owner ON child_profiles
USING (parent_id = auth.uid());

-- Polityki dziedziczące właściciela przez JOIN
CREATE POLICY sessions_owner ON sessions
USING (EXISTS (SELECT 1 FROM child_profiles cp WHERE cp.id = child_id AND cp.parent_id = auth.uid()));

CREATE POLICY task_results_owner ON task_results
USING (EXISTS (SELECT 1 FROM child_profiles cp WHERE cp.id = child_id AND cp.parent_id = auth.uid()));
```
Rola `service_role` ma `bypass RLS` dla zadań cron.

## 5. Dodatkowe uwagi / decyzje projektowe
* **Audit trigger** – wspólny trigger `set_updated_at()` ustawiający `NEW.updated_at = now()` na `BEFORE UPDATE` we wszystkich tabelach.
* **Sesja – wymuszenie jednej aktywnej** – trigger `deactivate_last_session()` przed `INSERT` w `sessions` ustawia `is_active = FALSE` dla wcześniejszego rekordu.
* **Retencja danych** – `ON DELETE CASCADE` od `auth.users` w dół oraz dodatkowy cron usuwający nieaktywne konta.
* **Agregacja wyników** – do rozstrzygnięcia: materialized view `child_totals` vs. `total_score` w `child_profiles` aktualizowane triggerem.
* **Sekwencyjne zadania** – aplikacja lub advisory lock `pg_advisory_xact_lock(child_id)` przy generowaniu następnego zadania, by zapobiec równoległym wywołaniom.


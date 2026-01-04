-- -----------------------------------------------------------------------------
-- migration: seed_sequence_level_1
-- purpose: populate the public.sequence table with 30 placeholder rows for
--          level 1 so that subsequent application logic has deterministic ids
--          to refer to.  The column values sequence_begining and
--          sequence_end are intentionally left as empty strings ('') to
--          satisfy the NOT NULL constraint while marking these fields as "to
--          be filled" by the application at a later stage.
--
-- affected table: public.sequence
-- dependencies   : requires that the table "sequence" and the foreign key to
--                  levels(id) already exist (created in previous migrations).
--
-- notes:
--   • we wrap the seeding in an explicit transaction (begin/commit) so that
--     the entire operation is atomic.
--   • we reference explicit columns to remain future-proof against schema
--     changes.
--   • we do not touch created_at / updated_at; they are populated by default
--     values / triggers defined on the table.
-- -----------------------------------------------------------------------------

begin;

insert into public.sequence (sequence_beginning, sequence_end, level_id)
values
    -- 15 items for level 1
    ('C4-E4-G4-C4-E4-G4', 'C4-E4', 1),
    ('A4-C4-E4-A4-C4-E4', 'A4-C4', 1),
    ('G4-B4-D4-G4-B4-D4', 'G4-B4', 1),
    ('G4-D4-G4-D4-G4-D4', 'G4-D4', 1),
    ('E4-E4-G4-E4-E4-G4', 'E4-E4', 1),
    ('C4-C4-E4-C4-C4-E4', 'C4-C4', 1),
    ('G4-G4-B4-G4-G4-B4', 'G4-G4', 1),
    ('A4-A4-B4-A4-A4-B4', 'A4-A4', 1),
    ('E4-E4-F4-E4-E4-F4', 'E4-E4', 1),
    ('C4-C4-D4-C4-C4-D4', 'C4-C4', 1),
    ('G4-G4-A4-G4-G4-A4', 'G4-G4', 1),
    ('B4-B4-C4-B4-B4-C4', 'B4-B4', 1),
    ('F4-F4-G4-F4-F4-G4', 'F4-F4', 1),
    ('D4-D4-E4-D4-D4-E4', 'D4-D4', 1),
    ('A4-A4-B4-A4-A4-B4', 'A4-A4', 1);

commit;
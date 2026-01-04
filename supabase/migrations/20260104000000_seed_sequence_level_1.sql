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
    ('C-E-G-C-E-G', 'C-E', 1),
    ('A-C-E-A-C-E', 'A-C', 1),
    ('G-H-D-G-H-D', 'G-H', 1),
    ('G-D-G-D-G-D', 'G-D', 1),
    ('E-E-G-E-E-G', 'E-E', 1),
    ('C-C-E-C-C-E', 'C-C', 1),
    ('G-G-H-G-G-H', 'G-G', 1),
    ('A-A-B-A-A-B', 'A-A', 1),
    ('E-E-F-E-E-F', 'E-E', 1),
    ('C-C-D-C-C-D', 'C-C', 1),
    ('G-G-A-G-G-A', 'G-G', 1),
    ('B-B-C-B-B-C', 'B-B', 1),
    ('F-F-G-F-F-G', 'F-F', 1),
    ('D-D-E-D-D-E', 'D-D', 1),
    ('A-A-B-A-A-B', 'A-A', 1);

commit;
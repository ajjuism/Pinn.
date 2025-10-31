/*
  # Create notes table for FlatNotes app

  1. New Tables
    - `notes`
      - `id` (uuid, primary key) - Unique identifier for each note
      - `title` (text) - Note title
      - `content` (text) - Note content (markdown format)
      - `created_at` (timestamptz) - When the note was created
      - `updated_at` (timestamptz) - When the note was last modified
  
  2. Security
    - Enable RLS on `notes` table
    - Add policies for public access (since no auth is mentioned in the design)
    
  3. Indexes
    - Add index on updated_at for efficient sorting
    - Add index on title and content for search functionality
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read notes"
  ON notes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert notes"
  ON notes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to update notes"
  ON notes
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete notes"
  ON notes
  FOR DELETE
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_notes_content ON notes USING gin(to_tsvector('english', content));
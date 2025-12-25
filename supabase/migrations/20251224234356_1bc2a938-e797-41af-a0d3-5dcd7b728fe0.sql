
-- Delete duplicate entries for user e692a88b (1984 - keep only the first entry from March 15)
DELETE FROM user_books 
WHERE id IN (
  'c4b4b271-da40-409a-816d-b92401ef8647',  -- Manchester duplicate
  '78605805-d3e1-4512-ade7-acc6f285fec5'   -- Edinburgh duplicate
);

-- Delete duplicate entries for user 13cef7f1 (To Kill a Mockingbird - keep only first SF entry)
DELETE FROM user_books 
WHERE id IN (
  '275cb7f5-c1e0-407e-98d5-1d24403bab73',  -- Oakland duplicate
  'af06749b-74c6-4115-9cd1-d5ff6d9cf138'   -- Berkeley duplicate
);

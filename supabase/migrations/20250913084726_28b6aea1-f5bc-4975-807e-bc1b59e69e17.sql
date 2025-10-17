-- Update existing book instances with neighborhood-level data for testing

-- SCENARIO 1: Same City, Different Neighborhoods

-- Dune in Tokyo: Shibuya vs Harajuku
UPDATE user_books SET
  neighborhood = 'Shibuya',
  district = 'Shibuya City',
  formatted_address = 'Shibuya, Tokyo, Japan',
  latitude = 35.6598,
  longitude = 139.7006
WHERE id = '0d8a80d4-f3dc-4469-a635-de85c2909a53';

UPDATE user_books SET
  neighborhood = 'Harajuku',
  district = 'Shibuya City', 
  formatted_address = 'Harajuku, Tokyo, Japan',
  latitude = 35.6702,
  longitude = 139.7016
WHERE id = 'f588eb0d-0972-4b38-881a-92133636d1fe';

-- Gone Girl in Chicago: River North vs Wicker Park
UPDATE user_books SET
  neighborhood = 'River North',
  district = 'Near North Side',
  formatted_address = 'River North, Chicago, USA',
  latitude = 41.8903,
  longitude = -87.6278
WHERE id = '64ddc9e5-9331-4771-a1c8-cf0bd93ece06';

UPDATE user_books SET
  neighborhood = 'Wicker Park',
  district = 'West Town',
  formatted_address = 'Wicker Park, Chicago, USA', 
  latitude = 41.9073,
  longitude = -87.6776
WHERE id = 'cd3cc1de-f509-451a-b9fd-97a7257e2abf';

-- Pride and Prejudice in New York: SoHo vs Williamsburg
UPDATE user_books SET
  neighborhood = 'SoHo',
  district = 'Manhattan',
  formatted_address = 'SoHo, New York, USA',
  latitude = 40.7230,
  longitude = -74.0028
WHERE id = '787ab7fc-bbef-4678-9471-60d81a0583de';

UPDATE user_books SET
  neighborhood = 'Williamsburg',
  district = 'Brooklyn',
  formatted_address = 'Williamsburg, New York, USA',
  latitude = 40.7081,
  longitude = -73.9571
WHERE id = '3a48e7c0-17d8-4968-bd72-cad7670c4c33';

-- Sapiens in Berlin: Mitte vs Kreuzberg
UPDATE user_books SET
  neighborhood = 'Mitte',
  district = 'Mitte',
  formatted_address = 'Mitte, Berlin, Germany',
  latitude = 52.5170,
  longitude = 13.3888
WHERE id = 'ce081dde-44bb-41a9-b9b0-c3a66f75fbdb';

UPDATE user_books SET
  neighborhood = 'Kreuzberg',
  district = 'Friedrichshain-Kreuzberg',
  formatted_address = 'Kreuzberg, Berlin, Germany',
  latitude = 52.4988,
  longitude = 13.4149
WHERE id = '3598ae64-8583-457e-94b0-3a7087bd7718';

-- The Girl with the Dragon Tattoo in London: Camden vs Notting Hill
UPDATE user_books SET
  neighborhood = 'Camden',
  district = 'Camden',
  formatted_address = 'Camden, London, UK',
  latitude = 51.5392,
  longitude = -0.1426
WHERE id = '3937ac98-bebb-4b97-b278-f502c1ec1ba7';

UPDATE user_books SET
  neighborhood = 'Notting Hill',
  district = 'Kensington and Chelsea',
  formatted_address = 'Notting Hill, London, UK',
  latitude = 51.5158,
  longitude = -0.2003
WHERE id = '001f3828-5c84-4c35-a478-cd0fadc8baed';

-- SCENARIO 2: Same Neighborhood Clustering Tests

-- Add Beverly Hills, Los Angeles for clustering test (updating some single-city books)
UPDATE user_books SET
  city = 'Los Angeles',
  neighborhood = 'Beverly Hills',
  district = 'Los Angeles County',
  formatted_address = 'Beverly Hills, Los Angeles, USA',
  latitude = 34.0736,
  longitude = -118.4004
WHERE id = '0d02b734-0076-4dae-8f1d-3fec435a5ea7'; -- Harry Potter instance 1

UPDATE user_books SET
  city = 'Los Angeles', 
  neighborhood = 'Beverly Hills',
  district = 'Los Angeles County',
  formatted_address = 'Beverly Hills, Los Angeles, USA',
  latitude = 34.0738,
  longitude = -118.4006
WHERE id = 'ad24eb77-de7f-4152-a002-d86ffa0e66b1'; -- Harry Potter instance 2

UPDATE user_books SET
  city = 'Los Angeles',
  neighborhood = 'Beverly Hills', 
  district = 'Los Angeles County',
  formatted_address = 'Beverly Hills, Los Angeles, USA',
  latitude = 34.0740,
  longitude = -118.4008
WHERE id = '1415d67f-5c11-4594-86df-32e8a7ff45e3'; -- Me Before You instance 1

-- Add more SoHo, Manhattan instances for clustering test
UPDATE user_books SET
  city = 'New York',
  neighborhood = 'SoHo',
  district = 'Manhattan', 
  formatted_address = 'SoHo, New York, USA',
  latitude = 40.7232,
  longitude = -74.0030
WHERE id = '3b3cbce3-83fb-4cd4-9039-96ac09c2d46f'; -- Neuromancer instance 1

UPDATE user_books SET
  city = 'New York',
  neighborhood = 'SoHo',
  district = 'Manhattan',
  formatted_address = 'SoHo, New York, USA', 
  latitude = 40.7234,
  longitude = -74.0032
WHERE id = 'ba257bf4-5292-4809-a00a-7ba32db24c7d'; -- Neuromancer instance 2

-- Update The Alchemist multi-city journey with specific neighborhoods
UPDATE user_books SET
  neighborhood = 'Greenwich Village',
  district = 'Manhattan',
  formatted_address = 'Greenwich Village, New York, USA',
  latitude = 40.7335,
  longitude = -74.0027
WHERE id = '5d1af93e-baef-456c-84c0-2aca64a18ceb'; -- The Alchemist - New York

UPDATE user_books SET
  neighborhood = 'Le Marais',
  district = '4th Arrondissement',
  formatted_address = 'Le Marais, Paris, France',
  latitude = 48.8566,
  longitude = 2.3522
WHERE id = 'acdeb314-290b-43ae-853b-cee3813693f4'; -- The Alchemist - Paris

UPDATE user_books SET
  neighborhood = 'Shinjuku',
  district = 'Shinjuku City',
  formatted_address = 'Shinjuku, Tokyo, Japan',
  latitude = 35.6896,
  longitude = 139.6917
WHERE id = '3e9df9d0-a969-4bfa-a82a-ab2f7c8ed697'; -- The Alchemist - Tokyo

UPDATE user_books SET
  neighborhood = 'The Rocks',
  district = 'Sydney',
  formatted_address = 'The Rocks, Sydney, Australia',
  latitude = -33.8599,
  longitude = 151.2090
WHERE id = '4d023f18-e844-4c75-b8ab-5424ed2052fe'; -- The Alchemist - Sydney

UPDATE user_books SET
  neighborhood = 'Copacabana',
  district = 'Zona Sul',
  formatted_address = 'Copacabana, Rio de Janeiro, Brazil',
  latitude = -22.9711,
  longitude = -43.1822
WHERE id = 'bfd436a4-07d1-4632-8d79-529cbfef1b93'; -- The Alchemist - Rio de Janeiro

-- Add remaining books with diverse neighborhoods to complete the test dataset
UPDATE user_books SET
  neighborhood = 'Old Town',
  district = 'Prague 1',
  formatted_address = 'Old Town, Prague, Czech Republic',
  latitude = 50.0875,
  longitude = 14.4213
WHERE id = '8a2cae68-421a-4e5d-aa10-bb3e5f180c30'; -- Educated instance 1

UPDATE user_books SET
  neighborhood = 'Vinohrady',
  district = 'Prague 2',
  formatted_address = 'Vinohrady, Prague, Czech Republic',
  latitude = 50.0755,
  longitude = 14.4378
WHERE id = '99b3b653-a4db-4972-a070-a30f0b4ab19b'; -- Educated instance 2

-- Delete chat messages in the test user conversation
DELETE FROM chat_messages WHERE room_id = '2c738a77-23cd-4909-aa4b-25ad8897f4d8';

-- Delete members from both broken rooms
DELETE FROM chat_room_members WHERE room_id = '14d46576-6020-435c-a251-5505290aba3f';
DELETE FROM chat_room_members WHERE room_id = '2c738a77-23cd-4909-aa4b-25ad8897f4d8';

-- Delete the orphaned room (Unknown - no other member, 0 messages)
DELETE FROM chat_rooms WHERE id = '14d46576-6020-435c-a251-5505290aba3f';

-- Delete the test user conversation room
DELETE FROM chat_rooms WHERE id = '2c738a77-23cd-4909-aa4b-25ad8897f4d8';

-- Also clean up the old conversations table entry with the test user
DELETE FROM conversations WHERE id = '448f269b-9225-404f-b591-466d93682b55';

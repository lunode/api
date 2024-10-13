-- Migration number: 0001 	 2024-09-25T14:03:05.260Z
create table posts (
  id INTEGER primary key AUTOINCREMENT,
  userId INTEGER not null,
  title text not null,
  body text not null
);
create table if not exists commets(
  id INTEGER primary key AUTOINCREMENT,
  postId INTEGER not null,
  name text not null,
  body text not null,
	email text not null,
	FOREIGN KEY(userId) REFERENCES users(user_id) ON DELETE CASCADE
)

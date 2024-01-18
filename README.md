# Login system REST API
Back-end for the login system, which allows to add/remove users, in addition to logging in and logging out.

## Base URL
http://localhost:8080/

## Authentication
Every user is authenticated via a session token. A session token is created when a successful login request is made. See (#Endpoints)[Endpoints] for more details about logging in.

## Error handling
The API returns standard HTTP status codes for success and error responses. Error responses include a JSON object with a `message` field providing details about the error.

## Endpoints
### 1. Login

- **Endpoint:** `/login`
- **Method:** `POST`
- **Description:** Allows you to get a session token, which allows you to authenticate for other endpoints.

Request
`
POST /login
Content-Type: application/json

{
"name": "<account username>",
"password": "<account password>",
}
`

Response
`
{
    "id": <user ID>,
    "name": "<username>",
    "hash": "<user hash>",
    "token": "<session token>"
}
`


### 2. Logout

- **Endpoint:** `/logout`
- **Method:** `GET`
- **Description:** Invalides current session token and destroys the session.

Request
`
GET /logout
`

Response
`
{
"id": <user ID>,
"name": "<username>",
"hash": "<user hash>",
"token": "<invalidated session token>"
}
`


### 3. Is logged in

- **Endpoint:** `/isloggedin/:sessionID`
- **Method:** `GET`
- **Description:** Allows the application to check whether a session token is valid.

Request
`
GET /isloggedin/:sessionID
`

Response
204: No content


### 4. Register a user

- **Endpoint:** `/users`
- **Method:** `POST`
- **Description:** Allows you to create a brand-new user account with specified details.

Request
`
POST /users
Content-Type: application/json

{
"name": "<account username>",
"password": "<account password>",
}
`

Response
`
{
"id": <new user ID>,
"name": "<new username>",
"hash": "<new user hash>",
}
`

### 5. Delete a user

- **Endpoint:** `/users/:id`
- **Method:** `DELETE`
- **Description:** Allows you to delete an authenticated account with the ID specified.

Request
`
DELETE /users/:id
`

Response
204: No content

### 6. Update user info

- **Endpoint:** `/users/:id`
- **Method:** `PUT`
- **Description:** Allows you to modify existing user data

Request
`
PUT /users/:id
Content-Type: application/json

{
"name": "<new username>",
"password": "<new password>",
}
`


Response
`
{
"id": <user ID>,
"name": "<new username>",
"hash": "<new user hash>",
}
`

### 7. Delete a note

- **Endpoint:** `/notes/:userId/:noteId`
- **Method:** `DELETE`
- **Description:** Allows you to delete a note while logged in for the user specified.

Request
`
DELETE /notes/:userId/:noteId
`

Response
204: No content

### 8. List notes

- **Endpoint:** `/notes/:userId`
- **Method:** `GET`
- **Description:** Allows you to get contents of all notes while logged in for the user specified.

Request
`
GET /notes/:userId
`

Response
`
[
    {
        "USER_ID": <user id>,
        "CONTENT": <note content>,
        "CREATED": <creation date/time>,
        "MODIFIED": <modified date/time>,
    },
    ...
]
`

### 9. Create a note

- **Endpoint:** `/notes/:userId`
- **Method:** `POST`
- **Description:** Allows you to create a new note for the user specified while logged in.

Request
`
POST /notes/:userId

{
    "content": <note contents>
}
`

Response
`
{
"id": <new note ID>,
"USER_ID": <user id for note>,
"CONTENT": <new note content>,
"CREATED": <note creation date/time>,
"MODIFIED": <will be same as CREATED during this request>
}
`

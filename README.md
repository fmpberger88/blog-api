# 📝 Blog API 📝

A simple blog application built with Node.js, Express, MongoDB, Cloudinary, and Passport JWT for authentication.

## 🌟 Features

- ✏️ Users can create, update, and delete blog posts.
- 🖼️ Users can upload images for their blog posts using Cloudinary.
- 💬 Users can comment on blog posts.
- 📅 Blog posts and comments are stored in a MongoDB database.
- ✅ Form validation and sanitization using `express-validator`.
- 🔐 Authentication and authorization using Passport JWT.

## 🛠️ Getting Started

### Prerequisites

- 🟢 Node.js and npm installed.
- 🟠 MongoDB installed and running locally or use a MongoDB Atlas account.
- ☁️ Cloudinary account for image uploads.
- 🔵 Redis installed and running locally or use a Redis on cloud (if using session management with RedisStore).

### Installation

1. 📥 Clone the repository:
    ```bash
    git clone https://github.com/yourusername/blog-api.git
    cd blog-api
    ```

2. 📦 Install the dependencies:
    ```bash
    npm install
    ```

3. 🗝️ Create a `.env` file in the root directory and add your MongoDB, Cloudinary, and JWT credentials:
    ```env
    PORT=5000
    MONGODB_URI=YourMongoURL
    NODE_ENV=development
    JWT_SECRET=YourJWTSecret
    CLOUDINARY_CLOUD_NAME=YourCloudinaryCloudName
    CLOUDINARY_API_KEY=YourCloudinaryAPIKey
    CLOUDINARY_API_SECRET=YourCloudinaryAPISecret
    ```

4. 🚀 Start the application:
    ```bash
    node app.js
    ```

   Alternatively, use `nodemon` for development:
    ```bash
    npm install -g nodemon
    npm run dev
    ```

### Usage

1. 🌐 Use a tool like Postman or Insomnia to interact with the API.
2. 🔑 Register a new user using the `/api/v1/register` endpoint.
3. 🔓 Log in using the `/api/v1/login` endpoint to receive a JWT token.
4. 📄 Use the token to authenticate your requests when creating, updating, or deleting blog posts and comments.

## API Endpoints

### Authentication
- `POST /api/v1/register` - Register a new user.
- `POST /api/v1/login` - Log in a user and receive a JWT token.

### Blogs
- `GET /api/v1/blogs` - Retrieve all published blogs.
- `GET /api/v1/blogs/:id` - Retrieve a single published blog by ID.
- `POST /api/v1/blogs` - Create a new blog post (requires JWT).
- `PUT /api/v1/blogs/:id` - Update a blog post (requires JWT and blog author authorization).
- `DELETE /api/v1/blogs/:id` - Delete a blog post (requires JWT and blog author authorization).
- `GET /api/v1/blogs/users-blogs` - Retrieve all blogs by the current user (requires JWT).

### Comments
- `GET /api/v1/comments/:blogId` - Retrieve all comments for a specific blog.
- `POST /api/v1/comments/:blogId` - Add a comment to a specific blog (requires JWT).
- `DELETE /api/v1/comments/:commentId` - Delete a comment (requires JWT and comment author authorization).

## Dependencies

- [express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js.
- [mongoose](https://mongoosejs.com/) - Elegant MongoDB object modeling for Node.js.
- [passport](https://www.passportjs.org/) - Simple, unobtrusive authentication for Node.js.
- [passport-jwt](http://www.passportjs.org/packages/passport-jwt/) - Passport strategy for authenticating with a JSON Web Token.
- [cloudinary](https://cloudinary.com/) - Cloud-based image and video management.
- [multer](https://www.npmjs.com/package/multer) - Node.js middleware for handling `multipart/form-data`.
- [express-validator](https://express-validator.github.io/docs/) - Express middleware for validation of incoming requests.
- [dotenv](https://github.com/motdotla/dotenv) - Loads environment variables from a `.env` file.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need to learn how to build a blog application with modern web technologies.
- Thanks to all the open-source contributors whose libraries and tools made this project possible.

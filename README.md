# PhotoHub
 Image Storage and Retrieval Application. Comprises of two services: Server and Client
 
Server is developed using Express, while Client uses React. Three datastores are used: MongoDB Atlas for authentication credentials, GCP Cloud Storage for file storage and Redis as a cache.

Upon Sign-Up, two buckets are created for the user on GCP Cloud Storage: read and write. Cloud Functions duplicates data from the write bucket to the read bucket. The user writes to the write bucket and reads from the read bucket.

Upon Login, every filename in the user's read bucket is cached in Redis. Once, these filenames are stored, they're used to obtain signed URLs of the requested files. These URLs are time bound and public allowing anybody with the URL to download the file.

After every upload, the filename and its signed URL is cached into Redis.

At the moment, only single file uploads are possible.

To run:
Ensure you have a Node.JS Runtime Environment installed and NPM.
Install npm modules in both backend and frontend folders according to the respective package.json
Open terminal and navigate to the backend directory.
Enter command: "npm run start"
Open a second terminal and navigate to frontend directory.
Enter command: "npm run start"

The backend port is specified in bin/www. While the frontend runs on the default port available, this port will be output in the terminal window.


Upcoming Updates:

Integration with GCP Cloud Vision API- To automatically generate and store file metadata. This would allow the user to search through their repository with keywords. This integration would be implemented using Cloud Functions to ensure a single call to API for every file.

Multi-Part/Resumable Downloads- To allow uploading multiple files at once and allow 'pausing' the process.

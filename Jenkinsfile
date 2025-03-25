pipeline {
    agent any

    environment {
        IMAGE_NAME = 'dawoodmasood/anime-stream-finder'
        IMAGE_TAG  = 'latest'
        PORT = 9999
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Docker Build') {
            steps {
                script {
                    // Build the Docker image using your Dockerfile (which includes multi-stage build)
                    dockerImage = docker.build("${IMAGE_NAME}:${IMAGE_TAG}")
                }
            }
        }
        stage('Deploy') {
            steps {
                script {
                    // Stop and remove the container if it exists
                    sh "docker stop anime-stream-finder || true"
                    sh "docker rm anime-stream-finder || true"
                    // Pull the updated image from Docker Hub (or your registry)
                    sh "docker pull ${IMAGE_NAME}:${IMAGE_TAG}"
                    // Run the container with a specific name and environment variables
                    sh "docker run -d --name anime-stream-finder -p ${PORT}:${PORT} -e PORT=${PORT} ${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }
    }
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}

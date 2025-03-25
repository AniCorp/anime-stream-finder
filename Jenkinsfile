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
                    // Stop and remove any container with the name "anime-stream-finder" if it exists
                    sh "docker stop anime-stream-finder || true"
                    sh "docker rm anime-stream-finder || true"
                    
                    // Optionally, ensure no container is using the specified port (e.g., 9999)
                    def runningContainer = sh(script: "docker ps -q --filter publish=${PORT}", returnStdout: true).trim()
                    if (runningContainer) {
                        sh "docker stop ${runningContainer}"
                        sh "docker rm ${runningContainer}"
                    }
                    
                    // Pull the latest image from your registry
                    sh "docker pull ${IMAGE_NAME}:${IMAGE_TAG}"
                    
                    // Run the new container with the latest image and the correct port mapping and environment variable
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

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
        stage('Test') {
            steps {
                // Run tests from within the built image (adjust npm test if needed)
                sh "docker run --rm ${IMAGE_NAME}:${IMAGE_TAG} npm test"
            }
        }
        stage('Deploy') {
            steps {
                // Run the container (adjust ports as needed)
                sh "docker run -d -p 8080:8080 ${IMAGE_NAME}:${IMAGE_TAG}"
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

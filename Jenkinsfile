pipeline {

    agent none   // ❗ remove global pod

    environment {
        DOCKER_CREDS = credentials('DOCKER_TOKEN')
        IMAGE_PREFIX = "inopsadmin"
        APP_VERSION = "${new Date().format('yyyy-MM-dd-HH-mm', TimeZone.getTimeZone('Asia/Kolkata'))}"
    }

    stages {

        stage('Build & Push Apps') {
            steps {
                script {

                    echo "Image Tag: ${env.APP_VERSION}"

                    // ✅ PREFIX LOGIC (unchanged)
                    def prefix = ''
                    if (env.BRANCH_NAME in ['demo', 'demo-v1.1.0']) {
                        prefix = 'demo_'
                    } else if (env.BRANCH_NAME in ['test', 'localhostDevTest', 'validation-new-menu']) {
                        prefix = 'test_'
                    } else if (env.BRANCH_NAME == 'HRMS_dev_test') {
                        prefix = 'hrms_dev_test_'
                    } else if (env.BRANCH_NAME == 'deployment') {
                        prefix = 'deployment_'
                    } else if (env.BRANCH_NAME in ['main', 'master']) {
                        prefix = 'demo_'
                    } else if (env.BRANCH_NAME == 'gcp') {
                        prefix = 'gcp_'
                    } else if (env.BRANCH_NAME == 'CLMS-ashok-leyland') {
                        prefix = 'clmsALL_'
                    } else if (env.BRANCH_NAME == 'hris-ashok-leyland') {
                        prefix = 'hrisALL_'
                    } else if (env.BRANCH_NAME == 'CLMS-production') {
                        prefix = 'prod_'
                    } else {
                        prefix = 'demo_'
                    }

                    echo "Using prefix: ${prefix}"

                    // ✅ LOAD ALL ENV VARIABLES (UNCHANGED)
                    withCredentials([
                        string(credentialsId: "${prefix}NEXT_PUBLIC_API_BASE_URL", variable: 'NEXT_PUBLIC_API_BASE_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_API_BASE_URL_KEYCLOCK", variable: 'NEXT_PUBLIC_API_BASE_URL_KEYCLOCK'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_MASTER_URL", variable: 'NEXT_PUBLIC_MASTER_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_WORKFLOW_URL", variable: 'NEXT_PUBLIC_WORKFLOW_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_REPORTS_URL", variable: 'NEXT_PUBLIC_REPORTS_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_DASHBOARD_URL", variable: 'NEXT_PUBLIC_DASHBOARD_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_LEAVE_URL", variable: 'NEXT_PUBLIC_LEAVE_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_MUSTER_URL", variable: 'NEXT_PUBLIC_MUSTER_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_WAGES_URL", variable: 'NEXT_PUBLIC_WAGES_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_OTAPPLICATION_URL", variable: 'NEXT_PUBLIC_OTAPPLICATION_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_NEXTAUTH_URL", variable: 'NEXT_PUBLIC_NEXTAUTH_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_BGM_URL", variable: 'NEXT_PUBLIC_BGM_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_AI_URL", variable: 'NEXT_PUBLIC_AI_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_AIAPPLICATION_URL", variable: 'NEXT_PUBLIC_AIAPPLICATION_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_CHALLAN_URL", variable: 'NEXT_PUBLIC_CHALLAN_URL'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_ENCRYPTION_KEY", variable: 'NEXT_PUBLIC_ENCRYPTION_KEY'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_REVERSEPROXY", variable: 'NEXT_PUBLIC_REVERSEPROXY'),
                        string(credentialsId: "${prefix}NEXT_PUBLIC_API_AI_URL", variable: 'NEXT_PUBLIC_API_AI_URL'),

                        string(credentialsId: "${prefix}NEXTAUTH_SECRET", variable: 'NEXTAUTH_SECRET'),
                        string(credentialsId: "${prefix}NEXT_KEYCLOAK_CLIENT_SECRET", variable: 'NEXT_KEYCLOAK_CLIENT_SECRET'),
                        string(credentialsId: "${prefix}NEXT_KEYCLOAK_CLIENT_ID", variable: 'NEXT_KEYCLOAK_CLIENT_ID'),
                        string(credentialsId: "${prefix}NEXT_KEYCLOAK_ISSUER", variable: 'NEXT_KEYCLOAK_ISSUER')
                    ]) {

                        def apps = [


                            [
        name: 'main',
        image: 'inops-main-app',
        dockerfile: 'apps/main/Dockerfile',
        args: [
            'NEXT_PUBLIC_API_BASE_URL',
            'NEXT_PUBLIC_API_BASE_URL_KEYCLOCK',
            'NEXT_PUBLIC_MASTER_URL',
            'NEXT_PUBLIC_WORKFLOW_URL',
            'NEXT_PUBLIC_REPORTS_URL',
            'NEXT_PUBLIC_DASHBOARD_URL',
            'NEXT_PUBLIC_LEAVE_URL',
            'NEXT_PUBLIC_MUSTER_URL',
            'NEXT_PUBLIC_WAGES_URL',
            'NEXT_PUBLIC_OTAPPLICATION_URL',
            'NEXT_PUBLIC_NEXTAUTH_URL',
            'NEXT_PUBLIC_BGM_URL',
            'NEXT_PUBLIC_AI_URL',
            'NEXTAUTH_SECRET',
            'NEXT_PUBLIC_AIAPPLICATION_URL',
            'NEXT_PUBLIC_CHALLAN_URL',
            'NEXT_PUBLIC_ENCRYPTION_KEY',
            'NEXT_PUBLIC_REVERSEPROXY',
            'NEXT_PUBLIC_API_AI_URL',
            'NEXT_KEYCLOAK_CLIENT_SECRET',
            'NEXT_KEYCLOAK_CLIENT_ID',
            'NEXT_KEYCLOAK_ISSUER'
        ]
    ],

    // [
    //     name: 'wage',
    //     image: 'inops-wages-app',
    //     dockerfile: 'apps/wage/Dockerfile',
    //     args: [
    //         'NEXT_PUBLIC_API_BASE_URL',
    //         'NEXT_PUBLIC_WAGES_URL',
    //         'NEXT_PUBLIC_NEXTAUTH_URL',
    //         'NEXT_PUBLIC_REVERSEPROXY',
    //         'NEXT_PUBLIC_ENCRYPTION_KEY',
    //         'NEXT_PUBLIC_API_AI_URL'
    //     ]
    // ],


    //                           [
    //     name: 'master',
    //     image: 'inops-master-app',
    //     dockerfile: 'apps/master/Dockerfile',
    //     args: [
    //         'NEXT_PUBLIC_API_BASE_URL',
    //         'NEXT_PUBLIC_MASTER_URL',
    //         'NEXT_PUBLIC_NEXTAUTH_URL',
    //         'NEXT_PUBLIC_REVERSEPROXY',
    //         'NEXT_PUBLIC_ENCRYPTION_KEY',
    //         'NEXT_PUBLIC_API_AI_URL'
    //     ]
    // ],


    //                         [
    //     name: 'reports',
    //     image: 'inops-reports-app',
    //     dockerfile: 'apps/reports/Dockerfile',
    //     args: [
    //         'NEXT_PUBLIC_API_BASE_URL',
    //         'NEXT_PUBLIC_REPORTS_URL',
    //         'NEXT_PUBLIC_NEXTAUTH_URL',
    //         'NEXT_PUBLIC_REVERSEPROXY',
    //         'NEXT_PUBLIC_ENCRYPTION_KEY',
    //         'NEXT_PUBLIC_API_AI_URL'
    //     ]
    // ],

    // [
    //     name: 'leave',
    //     image: 'inops-leave-app',
    //     dockerfile: 'apps/leave/Dockerfile',
    //     args: [
    //         'NEXT_PUBLIC_API_BASE_URL',
    //         'NEXT_PUBLIC_NEXTAUTH_URL',
    //         'NEXT_PUBLIC_REVERSEPROXY',
    //         'NEXT_PUBLIC_ENCRYPTION_KEY',
    //         'NEXT_PUBLIC_API_AI_URL'
    //     ]
    // ],

    // [
    //     name: 'muster',
    //     image: 'inops-muster-app',
    //     dockerfile: 'apps/muster/Dockerfile',
    //     args: [
    //         'NEXT_PUBLIC_API_BASE_URL',
    //         'NEXT_PUBLIC_MUSTER_URL',
    //         'NEXT_PUBLIC_NEXTAUTH_URL',
    //         'NEXT_PUBLIC_REVERSEPROXY',
    //         'NEXT_PUBLIC_ENCRYPTION_KEY',
    //         'NEXT_PUBLIC_API_AI_URL'
    //     ]
    // ],

    // [
    //     name: 'dashboard',
    //     image: 'inops-dashboard-app',
    //     dockerfile: 'apps/dashboard/Dockerfile',
    //     args: [
    //         'NEXT_PUBLIC_API_BASE_URL',
    //         'NEXT_PUBLIC_DASHBOARD_URL',
    //         'NEXT_PUBLIC_NEXTAUTH_URL',
    //         'NEXT_PUBLIC_REVERSEPROXY',
    //         'NEXT_PUBLIC_API_AI_URL'
    //     ]
    // ],

    [
        name: 'application',
        image: 'inops-application-app',
        dockerfile: 'apps/application/Dockerfile',
        args: [
            'NEXT_PUBLIC_API_BASE_URL',
            'NEXT_PUBLIC_NEXTAUTH_URL',
            'NEXT_PUBLIC_REVERSEPROXY',
            'NEXT_PUBLIC_ENCRYPTION_KEY',
            'NEXT_PUBLIC_API_AI_URL'
        ]
    ],

    [
        name: 'aiapplication',
        image: 'inops-aiapplication-app',
        dockerfile: 'apps/aiapplication/Dockerfile',
        args: [
            'NEXT_PUBLIC_API_BASE_URL',
            'NEXT_PUBLIC_AIAPPLICATION_URL',
            'NEXT_PUBLIC_NEXTAUTH_URL',
            'NEXT_PUBLIC_REVERSEPROXY',
            'NEXT_PUBLIC_ENCRYPTION_KEY',
            'NEXT_PUBLIC_API_AI_URL'
        ]
    ],

]

                        // 🔥 MAIN CHANGE (per app pod)
                        apps.each { app ->

                            echo "🚀 ${app.name} → New Pod"
                            echo "Build args for ${app.name}:"
                            app.args.each { arg ->
                                def rawValue = env."${arg}" ?: ''
                                def isSensitive = arg.toUpperCase().contains("SECRET") ||
                                    arg.toUpperCase().contains("KEY") ||
                                    arg.toUpperCase().contains("TOKEN") ||
                                    arg.toUpperCase().contains("PASSWORD")
                                def printableValue = isSensitive
                                    ? (rawValue ? "**** (len=${rawValue.length()})" : "<empty>")
                                    : (rawValue ?: "<empty>")
                                echo "  ${arg} = ${printableValue}"
                            }

                            podTemplate(yaml: """
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: node
      image: node:18
      command: ['cat']
      tty: true

    - name: kaniko
      image: gcr.io/kaniko-project/executor:debug
      command: ['cat']
      tty: true
      env:
        - name: DOCKER_CONFIG
          value: /kaniko/.docker/
      volumeMounts:
        - name: docker-config
          mountPath: /kaniko/.docker/

  volumes:
    - name: docker-config
      emptyDir: {}
""") {

                                node(POD_LABEL) {

                                    // ✅ Checkout inside pod
                                    container('node') {
                                        git branch: "${env.BRANCH_NAME}",
                                            credentialsId: 'jenkins-git',
                                            url: 'https://github.com/inopsadmin/inops-client-desktop.git'

                                        sh "npm install"
                                        sh "npx turbo run build --filter=${app.name}..."
                                    }

                                    // ✅ Docker build with ENV args
                                    container('kaniko') {

                                        def buildArgs = ""
                                        app.args.each { arg ->
                                            buildArgs += "--build-arg ${arg}=\${${arg}} "
                                        }

                                        sh """
                                            mkdir -p /kaniko/.docker
                                            cat <<EOF > /kaniko/.docker/config.json
{
  "auths": {
    "https://index.docker.io/v1/": {
      "username": "${DOCKER_CREDS_USR}",
      "password": "${DOCKER_CREDS_PSW}"
    }
  }
}
EOF

                                            /kaniko/executor \
                                              --dockerfile=${app.dockerfile} \
                                              --context=`pwd` \
                                              ${buildArgs} \
                                              --destination=${IMAGE_PREFIX}/${app.image}:${APP_VERSION}
                                        """
                                    }
                                }
                            }

                            echo "✅ ${app.name} done → pod destroyed"
                        }
                    }
                }
            }
        }

        stage('Helm Deploy') {
            agent {
                kubernetes {
                    yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: helm
      image: alpine/helm:3.13.2
      command: ['cat']
      tty: true
"""
                }
            }
            steps {
                container('helm') {
                    sh """
                        helm upgrade --install desktop-app ./helm-chart \
                          --set image.repository=${IMAGE_PREFIX}/inops-dashboard-app \
                          --set image.tag=${APP_VERSION}
                    """
                }
            }
        }
    }

    post {
        success { echo "✅ Build, Push & Deploy Successful!" }
        failure { echo "❌ Build Failed!" }
    }
}
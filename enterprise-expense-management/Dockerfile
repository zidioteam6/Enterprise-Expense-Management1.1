# Step 1: Use OpenJDK 17 as the base image
FROM openjdk:17

# Step 2: Copy the built JAR file from the target directory into the container
COPY target/*.jar app.jar

# Step 3: Set the entry point to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

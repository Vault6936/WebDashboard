plugins {
    id("java")
}

group = "com.vault6936"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.googlecode.json-simple:json-simple:1.1.1")
    implementation("org.java-websocket:Java-WebSocket:1.5.3")
    testImplementation(platform("org.junit:junit-bom:5.9.1"))
    testImplementation("org.junit.jupiter:junit-jupiter")
}

tasks.test {
    useJUnitPlatform()
}
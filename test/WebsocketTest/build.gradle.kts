plugins {
    id("java")
}

group = "com.vault6936"
version = "0.0.1"

repositories {
    mavenCentral()
}

dependencies {
    implementation("javax.json:javax.json-api:1.1.4")
    implementation("org.glassfish:javax.json:1.1.4")
    implementation("org.java-websocket:Java-WebSocket:1.5.3")
    testImplementation(platform("org.junit:junit-bom:5.9.1"))
    testImplementation("org.junit.jupiter:junit-jupiter")
}

tasks.test {
    useJUnitPlatform()
}
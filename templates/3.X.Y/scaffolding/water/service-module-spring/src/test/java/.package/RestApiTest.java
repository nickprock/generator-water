
package <%-projectGroupId%>;

import com.intuit.karate.junit5.Karate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.boot.test.web.server.LocalServerPort;
import it.water.core.testing.utils.runtime.TestRuntimeUtils;
import it.water.core.api.registry.ComponentRegistry;
import org.junit.jupiter.api.BeforeEach;
import <%-projectGroupId%>.service.<%-projectSuffixUpperCase%>Application;

@SpringBootTest(classes = <%- projectSuffixUpperCase %>Application.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "water.rest.security.jwt.validate.by.jws=false",
        "water.rest.security.jwt.validate=false",
        "water.testMode=true"
})
public class <%- projectSuffixUpperCase %>RestSpringApiTest {
    
    @Autowired
    private ComponentRegistry componentRegistry;

    @LocalServerPort
    private int serverPort;

    @BeforeEach
    void impersonateAdmin() {
        //jwt token service is disabled, we just inject admin user for bypassing permission system
        //just remove this line if you want test with permission system working
        TestRuntimeUtils.impersonateAdmin(componentRegistry);
    }

    @Karate.Test
    Karate restInterfaceTest() {
        return Karate.run("../<%- projectSuffixUpperCase %>-service/src/test/resources/karate")
                .systemProperty("webServerPort", String.valueOf(serverPort))
                .systemProperty("host", "localhost")
                .systemProperty("protocol", "http");
    }
}

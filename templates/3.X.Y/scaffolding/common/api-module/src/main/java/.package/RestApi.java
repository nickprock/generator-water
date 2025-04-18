package <%- apiPackage %>.rest;

<%if(hasModel){-%>
import <%-modelPackage%>.*;
<% } -%>
import it.water.core.api.model.PaginableResult;
import it.water.core.api.service.rest.FrameworkRestApi;
import it.water.core.api.service.rest.RestApi;
import it.water.service.rest.api.security.LoggedIn;

import com.fasterxml.jackson.annotation.JsonView;
import it.water.core.api.service.rest.WaterJsonView;
import io.swagger.annotations.*;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 * @Generated by Water Generator
 * Rest Api Interface for <%- projectSuffixUpperCase %> entity.
 * This interfaces exposes all CRUD methods with default JAXRS annotations.
 *
 */
<%let webPath =  restContextRoot.startsWith("/")?restContextRoot:"/"+restContextRoot; -%>
@Path("<%- webPath %>")
@Api(produces = MediaType.APPLICATION_JSON, tags = "<%- projectSuffixUpperCase %> API")
@FrameworkRestApi
public interface <%- projectSuffixUpperCase %>RestApi extends RestApi {

<% if(applicationTypeEntity) { -%>   
    <% if(hasAuthentication) { -%>   
    @LoggedIn
    <% } -%>
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @JsonView(WaterJsonView.Public.class)
    @ApiOperation(value = "/", notes = "<%- projectSuffixUpperCase %> Save API", httpMethod = "POST", produces = MediaType.APPLICATION_JSON)
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successful operation"),
            @ApiResponse(code = 401, message = "Not authorized"),
            @ApiResponse(code = 409, message = "Validation Failed"),
            @ApiResponse(code = 422, message = "Duplicated Entity"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    <%- projectSuffixUpperCase %> save(<%- projectSuffixUpperCase %> <%- projectSuffixLowerCase %>);

    <% if(hasAuthentication) { -%>   
    @LoggedIn
    <% } -%>
    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @JsonView(WaterJsonView.Public.class)
    @ApiOperation(value = "/", notes = "<%- projectSuffixUpperCase %> Update API", httpMethod = "PUT", produces = MediaType.APPLICATION_JSON)
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successful operation"),
            @ApiResponse(code = 401, message = "Not authorized"),
            @ApiResponse(code = 409, message = "Validation Failed"),
            @ApiResponse(code = 422, message = "Duplicated Entity"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    <%- projectSuffixUpperCase %> update(<%- projectSuffixUpperCase %> <%- projectSuffixLowerCase %>);

    <% if(hasAuthentication) { -%>   
    @LoggedIn
    <% } -%>
    @Path("/{id}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @JsonView(WaterJsonView.Public.class)
    @ApiOperation(value = "/{id}", notes = "<%- projectSuffixUpperCase %> Find API", httpMethod = "GET", produces = MediaType.APPLICATION_JSON)
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successful operation"),
            @ApiResponse(code = 401, message = "Not authorized"),
            @ApiResponse(code = 409, message = "Validation Failed"),
            @ApiResponse(code = 422, message = "Duplicated Entity"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    <%- projectSuffixUpperCase %> find(@PathParam("id") long id);

    <% if(hasAuthentication) { -%>   
    @LoggedIn
    <% } -%>
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @JsonView(WaterJsonView.Public.class)
    @ApiOperation(value = "/", notes = "<%- projectSuffixUpperCase %> Find All API", httpMethod = "GET", produces = MediaType.APPLICATION_JSON)
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successful operation"),
            @ApiResponse(code = 401, message = "Not authorized"),
            @ApiResponse(code = 409, message = "Validation Failed"),
            @ApiResponse(code = 422, message = "Duplicated Entity"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    PaginableResult<<%- projectSuffixUpperCase %>> findAll();

    <% if(hasAuthentication) { -%>   
    @LoggedIn
    <% } -%>
    @Path("/{id}")
    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @JsonView(WaterJsonView.Public.class)
    @ApiOperation(value = "/{id}", notes = "<%- projectSuffixUpperCase %> Delete API", httpMethod = "DELETE", produces = MediaType.APPLICATION_JSON)
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successful operation"),
            @ApiResponse(code = 401, message = "Not authorized"),
            @ApiResponse(code = 409, message = "Validation Failed"),
            @ApiResponse(code = 422, message = "Duplicated Entity"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    void remove(@PathParam("id") long id);
<% } -%>
}

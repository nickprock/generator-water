let { AcsBaseGenerator } = require('acs-abstract-generator');
const DepCycleChecker = require('./WaterDepCycleChecker.js');
const axios = require("axios");
const path = require("path");
let fs = require('fs');
let chalk = require('chalk');
const tty = require("tty");
/* global Promise */
let splash = '' +
    '@@@  @@@  @@@   @@@@@@   @@@@@@@  @@@@@@@@  @@@@@@@   \n'+
    '@@@  @@@  @@@  @@@@@@@@  @@@@@@@  @@@@@@@@  @@@@@@@@  \n'+
    '@@!  @@!  @@!  @@!  @@@    @@!    @@!       @@!  @@@  \n'+
    '!@!  !@!  !@!  !@!  @!@    !@!    !@!       !@!  @!@  \n'+
    '@!!  !!@  @!@  @!@!@!@!    @!!    @!!!:!    @!@!!@!   \n'+
    '!@!  !!!  !@!  !!!@!!!!    !!!    !!!!!:    !!@!@!    \n'+
    '!!:  !!:  !!:  !!:  !!!    !!:    !!:       !!: :!!   \n'+
    ':!:  :!:  :!:  :!:  !:!    :!:    :!:       :!:  !:!  \n'+
    ':::: :: :::   ::   :::     ::     :: ::::  ::   :::   \n'+
    ':: :  : :     :   : :     :     : :: ::    :   : :    \n'+
    '\n\t Version: <%- generatorVersion %>' +
    '\n';


module.exports = class extends AcsBaseGenerator {

    constructor(args, opts) {
        super(args, opts);
    }


    getWaterFrameworkVersion() {
        if (this.config.get("WaterVersion") === undefined || this.config.get("WaterVersion") === null) {
            this.config.set("WaterVersion", "3.0.0");
            this.config.save();
        }
        return this.config.get("WaterVersion");
    }

    getWaterGenericFrameworkMajorkVersion(fullVersion) {
        let index = fullVersion.indexOf(".")
        return fullVersion.substring(0, index) + ".X.Y";
    }

    getWaterGenericFrameworkMinorkVersion(fullVersion) {
        let index = fullVersion.lastIndexOf(".")
        return fullVersion.substring(0, index) + ".X";
    }

    getWaterWorkspaceTechnology() {
        if (this.config.get("workspaceTechnology") === undefined || this.config.get("workspaceTechnology") === null) {
            this.config.set("workspaceTechnology", "water");
            this.config.save();
        }
        return this.config.get("workspaceTechnology");
    }

    getWaterTemplatePath(currentVersion) {
        if (!currentVersion)
            currentVersion = this.getWaterFrameworkVersion();
        let basePath = this.generatorPath + "templates/";

        let templatePathMinorVersion = basePath + this.getWaterGenericFrameworkMinorkVersion(currentVersion);
        let templatePathMajorVersion = basePath + this.getWaterGenericFrameworkMajorkVersion(currentVersion);
        let templatePathFullVersion = basePath + currentVersion;
        let templatePath = basePath + "basic";
        let found = false;
        if (fs.existsSync(templatePathFullVersion)){
            templatePath = templatePathFullVersion;
            found = true;
        } else if (fs.existsSync(templatePathMinorVersion)){
            templatePath = templatePathMinorVersion;
            found = true;
        } else if (fs.existsSync(templatePathMajorVersion)){
            templatePath = templatePathMajorVersion;
            found = true;
        }

        if(!found){
            this.log.info("No path found for: "+templatePathFullVersion);
            this.log.info("No path found for: "+templatePathMajorVersion);
            this.log.info("No path found for: "+templatePathMinorVersion);
        }
        
        return templatePath;
    }

    printSplash() {
        let generatorVersion = this.getGeneratorVersion();
        let splashCompiled = this.compileEjsContent(splash, {
            generatorVersion: generatorVersion
        });
        super.printSplash(splashCompiled);
    }

    getPublishRepoPrompts() {
        return [
            {
                type: 'confirm',
                name: 'publishRepo',
                message: 'Do you have a custom repository where modules must be deployed to?:',
                default: false
            },
            {
                type: 'input',
                name: 'publishRepoName',
                message: 'Please insert publish repository name:',
                default: "",
                when: function (answers) {
                    return answers.publishRepo;
                }

            },
            {
                type: 'input',
                name: 'publishRepoUrl',
                message: 'Please insert publish repository url:',
                default: "",
                when: function (answers) {
                    return answers.publishRepo;
                }

            },
            {
                type: 'confirm',
                name: 'publishHasCredentials',
                message: 'Is your repository secured by credentials?:',
                default: false,
                when: function (answers) {
                    return answers.publishRepo;
                }
            }
        ];
    }

    updateProjectConfOnGeneration(projectConf) {
        this.log.info("updating: " + this.destinationPath("modules/" + projectConf.projectName + "/.yo-rc.json"));
        let confUpdate = {
            "generator-Water": projectConf
        }
        this.writeToFile(JSON.stringify(confUpdate, null, '\t'), this.destinationPath("modules/" + projectConf.projectName + "/.yo-rc.json"));
    }

    createBasicProjectFiles(destFolder,conf){
        this.log.info("Creating basic project files...")
        let templatePath = this.getWaterTemplatePath(this.waterVersion)+"/scaffolding/common/empty-module";
        this.fs.copyTpl(templatePath, destFolder, conf);
        this.fs.copyTpl(templatePath + "/.yo-rc.json", destFolder + "/.yo-rc.json", conf);
        this.fs.copyTpl(templatePath + "/gitignore", destFolder + "/.gitignore", conf);
    }

    generateModelProject(projectConf) {
        this.log.info(chalk.bold.yellow("Creating Model module..."));
        let finalPath = projectConf.projectModelPath;
        if(projectConf.projectTechnology !== "water"){
            finalPath = projectConf.projectServicePath;
        }
        this.createBasicProjectFiles(this.destinationPath(finalPath),projectConf);
        let modelTemplatePath = this.getWaterTemplatePath(this.waterVersion)+"/scaffolding/common/model-module";
        this.log.info("Model Common Template path is: "+modelTemplatePath)
        let technologyTemplatePath = this.getWaterTemplatePath(this.waterVersion)+"/scaffolding/"+projectConf.projectTechnology+"/model-module";
        let technologyTemplatePathExists = fs.existsSync(technologyTemplatePath);
        this.log.info("Technology Template path is: "+technologyTemplatePath+" \n destination path: "+this.destinationPath(finalPath))
        this.fs.copyTpl(modelTemplatePath, this.destinationPath(finalPath), projectConf);
        this.fs.copyTpl(modelTemplatePath+"/.yo-rc.json", this.destinationPath(finalPath)+"/.yo-rc.json", projectConf);
        if(technologyTemplatePathExists){
            //Overriding eventually with specific technologies files
            this.fs.copyTpl(technologyTemplatePath, this.destinationPath(finalPath), projectConf);
        }
        if(fs.existsSync(technologyTemplatePath+"/.yo-rc.json"))
            this.fs.copyTpl(technologyTemplatePath+"/.yo-rc.json", this.destinationPath(finalPath)+"/.yo-rc.json", projectConf);

        if (projectConf.hasModel || projectConf.applicationTypeEntity) {
            this.log.info("Creating Entity ...")
            this.fs.copyTpl(modelTemplatePath + "/src/main/java/.package/Entity.java", this.destinationPath(finalPath + "/" + projectConf.modelPackagePath + "/" + projectConf.projectSuffixUpperCase + ".java"), projectConf);
            //overriding with specific technology if exists
            if(fs.existsSync(technologyTemplatePath+"/src/main/java/.package/Entity.java"))
                this.fs.copyTpl(technologyTemplatePath+"/src/main/java/.package/Entity.java", this.destinationPath(finalPath + "/" + projectConf.modelPackagePath + "/" + projectConf.projectSuffixUpperCase + ".java"), projectConf);
        }
        this.log.ok("Model Project created succesfully!");
    }

    generateApiProject(projectConf) {
        this.log.info(chalk.bold.yellow("Creating Api module..."));
        let finalPath = projectConf.projectApiPath;
        if(projectConf.projectTechnology !== "water"){
            finalPath = projectConf.projectServicePath;
        }
        this.createBasicProjectFiles(this.destinationPath(finalPath),projectConf);
        let apiTemplatePath = this.getWaterTemplatePath(this.waterVersion)+"/scaffolding/common/api-module";
        this.log.info("Api Common Template path is: "+apiTemplatePath)
        let technologyTemplatePath = this.getWaterTemplatePath(this.waterVersion)+"/scaffolding/"+projectConf.projectTechnology+"/api-module";
        let technologyTemplatePathExists = fs.existsSync(technologyTemplatePath);
        this.log.info("Technology Template path is: "+technologyTemplatePath+" \n destination path: "+this.destinationPath(finalPath))
        this.fs.copyTpl(apiTemplatePath, this.destinationPath(finalPath), projectConf);
        this.fs.copyTpl(apiTemplatePath+"/.yo-rc.json", this.destinationPath(finalPath)+"/.yo-rc.json", projectConf);
        
        //adds file only if there's content inside
        if(technologyTemplatePathExists && fs.readdirSync(technologyTemplatePath).lenght > 0){
            //Overriding eventually with specific technologies files
            this.fs.copyTpl(technologyTemplatePath, this.destinationPath(finalPath), projectConf);
        }

        if(fs.existsSync(technologyTemplatePath+"/.yo-rc.json"))
            this.fs.copyTpl(technologyTemplatePath+"/.yo-rc.json", this.destinationPath(finalPath)+"/.yo-rc.json", projectConf);
        if (projectConf.applicationTypeEntity) {
            this.log.info("Creating Entity Api...")
            this.fs.copyTpl(apiTemplatePath + "/src/main/java/.package/EntityApi.java", this.destinationPath(finalPath + "/" + projectConf.apiPackagePath + "/" + projectConf.projectSuffixUpperCase + "Api.java"), projectConf);
            this.log.info("Creating Entity System Api...")
            this.fs.copyTpl(apiTemplatePath + "/src/main/java/.package/SystemEntityApi.java", this.destinationPath(finalPath + "/" + projectConf.apiPackagePath + "/" + projectConf.projectSuffixUpperCase + "SystemApi.java"), projectConf);
            this.log.info("Creating Repository Interface...")
            this.fs.copyTpl(apiTemplatePath + "/src/main/java/.package/RepoInterface.java", this.destinationPath(finalPath + "/" + projectConf.apiPackagePath + "/" + projectConf.projectSuffixUpperCase + "Repository.java"), projectConf);
            if(technologyTemplatePathExists){
                //overriding with specific technology
                this.fs.copyTpl(technologyTemplatePath + "/src/main/java/.package/RepoInterface.java", this.destinationPath(finalPath + "/" + projectConf.apiPackagePath + "/" + projectConf.projectSuffixUpperCase + "Repository.java"), projectConf);    
            }
        } else {
            this.fs.copyTpl(apiTemplatePath + "/src/main/java/.package/ServiceApi.java", this.destinationPath(finalPath + "/" + projectConf.apiPackagePath + "/" + projectConf.projectSuffixUpperCase + "Api.java"), projectConf);
            this.fs.copyTpl(apiTemplatePath + "/src/main/java/.package/SystemServiceApi.java", this.destinationPath(finalPath + "/" + projectConf.apiPackagePath + "/" + projectConf.projectSuffixUpperCase + "SystemApi.java"), projectConf);
            if(technologyTemplatePathExists){
                //overriding with specific technology
                if(fs.existsSync(technologyTemplatePath+"/src/main/java/.package/ServiceApi.java"))
                    this.fs.copyTpl(technologyTemplatePath + "/src/main/java/.package/ServiceApi.java", this.destinationPath(finalPath + "/" + projectConf.apiPackagePath + "/" + projectConf.projectSuffixUpperCase + "Api.java"), projectConf);
                if(fs.existsSync(technologyTemplatePath+"/src/main/java/.package/SystemServiceApi.java"))
                    this.fs.copyTpl(technologyTemplatePath + "/src/main/java/.package/SystemServiceApi.java", this.destinationPath(finalPath + "/" + projectConf.apiPackagePath + "/" + projectConf.projectSuffixUpperCase + "SystemApi.java"), projectConf);
            }
        }

        if(projectConf.hasRestServices){
            this.log.info("Creating Rest Api Interface...")
            this.fs.copyTpl(apiTemplatePath+"/src/main/java/.package/RestApi.java", this.destinationPath(finalPath)+projectConf.apiPackagePath+"/rest/"+projectConf.projectSuffixUpperCase+"RestApi.java", projectConf);
            if(technologyTemplatePathExists){
                this.fs.copyTpl(technologyTemplatePath+"/src/main/java/.package/RestApi.java", this.destinationPath(finalPath)+projectConf.apiPackagePath+"/rest/"+projectConf.projectSuffixUpperCase+"RestApi.java", projectConf);
            }
        }

        this.log.ok("Api Project created succesfully!");
    }

    generateServiceProject(projectConf) {
        this.log.info(chalk.bold.yellow("Creating Service module..."));
        this.createBasicProjectFiles(this.destinationPath(projectConf.projectServicePath),projectConf);
        let serviceTemplatePath = this.getWaterTemplatePath(this.waterVersion)+"/scaffolding/common/service-module";
        
        this.log.info("Service Common Template path is: "+serviceTemplatePath)
        let technologyTemplatePath = this.getWaterTemplatePath(this.waterVersion)+"/scaffolding/"+projectConf.projectTechnology+"/service-module";
        let technologyTemplatePathExists = fs.existsSync(technologyTemplatePath);
        this.log.info("Technology Template path is: "+technologyTemplatePath+" \n destination path: "+this.destinationPath(projectConf.projectServicePath))
        this.fs.copyTpl(serviceTemplatePath, this.destinationPath(projectConf.projectServicePath), projectConf);
        this.fs.copyTpl(serviceTemplatePath+"/.yo-rc.json", this.destinationPath(projectConf.projectServicePath)+"/.yo-rc.json", projectConf);
        
        if(technologyTemplatePathExists){
            //Overriding eventually with specific technologies files
            this.log.info("Overriding basic files with "+projectConf.projectTechnology+" specific files...")
            this.fs.copyTpl(technologyTemplatePath, this.destinationPath(projectConf.projectServicePath), projectConf);
        }

        if(fs.existsSync(technologyTemplatePath+"/.yo-rc.json"))
            this.fs.copyTpl(technologyTemplatePath+"/.yo-rc.json", this.destinationPath(projectConf.projectServicePath)+"/.yo-rc.json", projectConf);

        if (projectConf.applicationTypeEntity) {
            this.log.info("Creating Persistence Layer...")
            this.log.info("Creating repositories implementation...");
            if(!projectConf.springRepository){
                this.fs.copyTpl(serviceTemplatePath+"/src/main/java/.repository_package/RepositoryImpl.java", this.destinationPath(projectConf.projectServicePath)+projectConf.repositoryPackagePath+"/"+projectConf.projectSuffixUpperCase+"RepositoryImpl.java", projectConf);
                if(fs.existsSync(technologyTemplatePath+"/src/main/java/.repository_package/RepositoryImpl.java"))
                    this.fs.copyTpl(technologyTemplatePath+"/src/main/java/.repository_package/RepositoryImpl.java", this.destinationPath(projectConf.projectServicePath)+projectConf.repositoryPackagePath+"/"+projectConf.projectSuffixUpperCase+"RepositoryImpl.java", projectConf);
            }
        }

        this.log.info("Creating Api Layer...")
        this.fs.copyTpl(serviceTemplatePath+"/src/main/java/.service_package/ApiImpl.java", this.destinationPath(projectConf.projectServicePath)+projectConf.servicePackagePath+"/"+projectConf.projectSuffixUpperCase+"ServiceImpl.java", projectConf);
        this.fs.copyTpl(serviceTemplatePath+"/src/main/java/.service_package/SystemApiImpl.java", this.destinationPath(projectConf.projectServicePath)+projectConf.servicePackagePath+"/"+projectConf.projectSuffixUpperCase+"SystemServiceImpl.java", projectConf);
        //Overriding with specific technology
        if(fs.existsSync(technologyTemplatePath+"/src/main/java/.service_package/ApiImpl.java"))
            this.fs.copyTpl(technologyTemplatePath+"/src/main/java/.service_package/ApiImpl.java", this.destinationPath(projectConf.projectServicePath)+projectConf.servicePackagePath+"/"+projectConf.projectSuffixUpperCase+"ServiceImpl.java", projectConf);
        
        if(fs.existsSync(technologyTemplatePath+"/src/main/java/.service_package/SystemApiImpl.java"))
            this.fs.copyTpl(technologyTemplatePath+"/src/main/java/.service_package/SystemApiImpl.java", this.destinationPath(projectConf.projectServicePath)+projectConf.servicePackagePath+"/"+projectConf.projectSuffixUpperCase+"SystemServiceImpl.java", projectConf);
        
        if (projectConf.hasRestServices) {
            this.log.info("Creating Rest Layer...")
            this.fs.copyTpl(serviceTemplatePath+"/src/main/java/.service_rest_package/RestControllerImpl.java", this.destinationPath(projectConf.projectServicePath)+projectConf.serviceRestPackagePath+"/"+projectConf.projectSuffixUpperCase+"RestControllerImpl.java", projectConf);
            if(fs.existsSync(technologyTemplatePath+"/src/main/java/.service_rest_package/RestControllerImpl.java"))
                this.fs.copyTpl(technologyTemplatePath+"/src/main/java/.service_rest_package/RestControllerImpl.java", this.destinationPath(projectConf.projectServicePath)+projectConf.serviceRestPackagePath+"/"+projectConf.projectSuffixUpperCase+"RestControllerImpl.java", projectConf);
        }

        this.log.info("Creating Tests...")
        this.fs.copyTpl(serviceTemplatePath+"/src/test/java/.package/TestApi.java", this.destinationPath(projectConf.projectServicePath)+projectConf.projectTestPath+"/"+projectConf.projectSuffixUpperCase+"ApiTest.java", projectConf);
        if(projectConf.hasRestServices){
            this.fs.copyTpl(serviceTemplatePath+"/src/test/java/.package/TestRestApi.java", this.destinationPath(projectConf.projectServicePath)+projectConf.projectTestPath+"/"+projectConf.projectSuffixUpperCase+"RestApiTest.java", projectConf);
        }
        //Overriding tests with specific technology
        if(fs.existsSync(technologyTemplatePath+"/src/test/java/.package/TestApi.java"))
            this.fs.copyTpl(technologyTemplatePath+"/src/test/java/.package/TestApi.java", this.destinationPath(projectConf.projectServicePath)+projectConf.projectTestPath+"/"+projectConf.projectSuffixUpperCase+"ApiTest.java", projectConf);
        if(fs.existsSync(technologyTemplatePath+"/src/test/java/.package/TestRestApi.java") && projectConf.hasRestServices)
            this.fs.copyTpl(technologyTemplatePath+"/src/test/java/.package/TestRestApi.java", this.destinationPath(projectConf.projectServicePath)+projectConf.projectTestPath+"/"+projectConf.projectSuffixUpperCase+"RestApiTest.java", projectConf);
        
        if(projectConf.projectTechnology === "spring"){
            //using the same destination path for tests, in order to cover also spring requirements
            this.log.info("Generating Spring application...")
            this.fs.copyTpl(technologyTemplatePath+"/src/main/java/.service_package/Application.java", this.destinationPath(projectConf.projectServicePath)+projectConf.projectBasePath+"/"+projectConf.projectSuffixUpperCase+"Application.java", projectConf);
            let testMetaInfFolder = this.destinationPath(projectConf.projectServicePath)+"/src/test/resources/META-INF";
            let testAppPropFile = this.destinationPath(projectConf.projectServicePath)+"/src/test/resources/it.water.application.properties";
            let certsPath = this.destinationPath(projectConf.projectServicePath)+"/src/test/resources/certs";
            this.log.info("Removing "+testMetaInfFolder);
            this.fs.delete(testMetaInfFolder,{ recursive: true, force: true });
            this.log.info("Removing "+testAppPropFile);
            this.fs.delete(testAppPropFile,{ force: true });
            this.log.info("Removing "+certsPath);
            this.fs.delete(certsPath,{ recursive: true, force: true })
        } else if (projectConf.projectTechnology === "osgi"){
            this.fs.copyTpl(technologyTemplatePath+"/src/test/java/.package/TestConfiguration.java", this.destinationPath(projectConf.projectServicePath)+projectConf.projectTestPath+"/"+projectConf.projectSuffixUpperCase+"TestConfiguration.java", projectConf);
            //removing persistence.xml from the common template
            let persistenceXml = this.destinationPath(projectConf.projectServicePath)+"/src/test/resources/META-INF/persistence.xml";
            //removing app properties which is not used
            let appProperties = this.destinationPath(projectConf.projectServicePath)+"/src/test/resources/it.water.application.properties";
            //removing certificates path
            let certsPath = this.destinationPath(projectConf.projectServicePath)+"/src/test/resources/certs";
            this.log.info("Removing "+persistenceXml);
            this.fs.delete(persistenceXml,{ recursive: true, force: true });
            this.log.info("Removing "+appProperties);
            this.fs.delete(appProperties,{ recursive: true, force: true })
            this.log.info("Removing "+certsPath);
            this.fs.delete(certsPath,{ recursive: true, force: true })
        } else if(projectConf.projectTechnology ===  "water" && projectConf.hasRestServices) {
            //Creating spring module also
            let serviceSpringTemplatePath = this.getWaterTemplatePath(this.waterVersion)+"/scaffolding/water/service-module-spring";
            let serviceSpringDestinationPath = this.destinationPath(projectConf.projectServicePath)+"-spring";
            this.log.info("Starting from spring tempalte in " + serviceSpringTemplatePath+" and copying to ");
            this.fs.copyTpl(serviceSpringTemplatePath, serviceSpringDestinationPath, projectConf);
            //Copying java classes
            this.fs.copyTpl(serviceSpringTemplatePath+"/src/main/java/.spring_api_rest_package/SpringRestApi.java", serviceSpringDestinationPath+projectConf.serviceRestPackagePath+"/spring/"+projectConf.projectSuffixUpperCase+"SpringRestApi.java", projectConf);
            this.fs.copyTpl(serviceSpringTemplatePath+"/src/main/java/.spring_service_rest_package/SpringRestControllerImpl.java", serviceSpringDestinationPath+projectConf.serviceRestPackagePath+"/spring/"+projectConf.projectSuffixUpperCase+"SpringRestControllerImpl.java", projectConf);
            this.fs.copyTpl(serviceSpringTemplatePath+"/src/main/java/.Application.java", serviceSpringDestinationPath+projectConf.servicePackagePath+"/"+projectConf.projectSuffixUpperCase+"Application.java", projectConf);
            this.fs.copyTpl(serviceSpringTemplatePath+"/src/test/java/.package/RestApiTest.java", serviceSpringDestinationPath+projectConf.projectTestPath+"/"+projectConf.projectSuffixUpperCase+"RestSpringApiTest.java", projectConf);
        }

        if(!projectConf.hasRestServices){
            let karatePath = this.destinationPath(projectConf.projectServicePath)+"/src/test/resources/karate/";
            let karateConfigPath = this.destinationPath(projectConf.projectServicePath)+"/src/test/resources/karate-config.js";
            this.log.info("Removing "+karatePath);
            this.fs.delete(karatePath,{ recursive: true, force: true })
            this.log.info("Removing "+karateConfigPath);
            this.fs.delete(karateConfigPath,{ recursive: true, force: true })
        }

        this.log.ok("Service module created succesfully!");
    }

    launchProjectsBuild(projectsName) {
        let results = []
        for (let i = 0; i < projectsName.length; i++) {
            results[projectsName[i]] = this.launchSingleProjectBuild(projectsName[i]);
        }
        return results;
    }

    async launchProjectsPublish(projectsName, repoUsername, repoPassword) {
        let results = [];
        let workspaceDir = process.cwd();
        for (let i = 0; i < projectsName.length; i++) {
            this.log.ok("processing: " + projectsName[i]);
            let buildOk = this.launchSingleProjectBuild(projectsName[i]);
            let testOk = true;
            if (buildOk) {
                if (!this.options.skipTest) {
                    if(this.getProjectConfiguration(projectsName[i]).hasSonarqubeIntegration){
                        if(!this.options.sonarHost || !this.options.sonarToken){
                            testOk = false;
                            this.log.error("Please insert --sonarHost and --sonarToken in order!");
                        } else {
                            this.log.info("Starting sonarqube analysis at ",this.options.sonarHost);
                            testOk = await this.launchSingleProjectTest(projectsName[i],this.options.sonarHost,this.options.sonarToken);
                        }
                    } else {
                        this.log.info("Starting tests ...")
                        testOk = this.launchSingleProjectTest(projectsName[i],null,null);
                    }
                    
                }
                //test ok is true if test are not enabled
                if (testOk) {
                    results[projectsName[i]] = this.launchSingleProjectPublish(projectsName[i], repoUsername, repoPassword);
                } else {
                    results[projectsName[i]] = false;
                }
            } else {
                results[projectsName[i]] = false;
            }
        }
        process.chdir(workspaceDir);
        return results;
    }

    launchSingleProjectBuild(projectName) {
        this.log.ok("building: " + projectName);
        let buildResult = null;
        let workspaceDir = process.cwd();
        //if water is not inside the specific project folder it runs into it
        let restorePreviousFolder = false;
        //TODO remove or change this check since it can generat ambigous behaviorus
        if(!workspaceDir.endsWith(projectName)){
            restorePreviousFolder = true;
            process.chdir(projectName);
        }
        
        let depCycleChecker = new DepCycleChecker();
        depCycleChecker.checkDepCycles(true,this);

        let buildCommand = ["clean","build"] 
        buildResult = this.spawnCommandSync("gradle", [...buildCommand,"-x","test"]);
        let projectKarafFeaturesPath = this.config.get("projectsConfiguration")[projectName]["projectFeaturesPath"];
        if(projectKarafFeaturesPath !== null && projectKarafFeaturesPath !== undefined && projectKarafFeaturesPath.length > 0){
            let featureDir = workspaceDir+"/"+projectKarafFeaturesPath+"/src/main/resources/features-src.xml";
            if (fs.existsSync(featureDir)){
                if(buildResult.status === 0) {
                        this.log.info("---------------> GENERATING FEATURES--------------------")
                        this.log.info("Features path: "+featureDir)
                        buildResult = this.spawnCommandSync("gradle", ["clean","generateFeatures"]);
                    }
                }
        }

        if (buildResult.status === 0) {
            this.spawnCommandSync("gradle", ["publishToMavenLocal"]);
            this.log.ok("Build of " + projectName + " completed succesfully");
        } else {
            this.log.error("Build of " + projectName + " completed with errors");
        }

        if(restorePreviousFolder)
            process.chdir("../");

        return buildResult.status === 0;
    }

    launchSingleProjectPublish(projectName, repoUsername, repoPassword) {
        let publishOk = false;
        let modules = super.getModuleNamesCommaSeparated(projectName);
        let publishCommand = "publish" 
        let publishHITArgs = [publishCommand, "-DprojectsToBuild=" + modules];
        let publishFeatureArgs = ["publishFeatures", "-DprojectsToBuild=" + modules];
        //populating credentials
        if (repoUsername && repoPassword) {
            publishHITArgs.push("-DpublishRepoUsername=" + repoUsername)
            publishHITArgs.push("-DpublishRepoPassword=" + repoPassword)
            publishFeatureArgs.push("-DpublishRepoUsername=" + repoUsername)
            publishFeatureArgs.push("-DpublishRepoPassword=" + repoPassword)
        }
        process.chdir(projectName);
        let publishResult = this.spawnCommandSync("gradle", publishHITArgs);
        process.chdir("../");
        publishOk = publishResult.status === 0;
        if (publishResult.status === 0) {
            this.log.ok("Publishing of " + projectName + " completed succesfully");
        } else {
            this.log.error("Publishing of " + projectName + " completed with errors");
        }
        return publishOk;
    }

    async launchSingleProjectTest(projectName, sonarHost, sonarToken) {
        let testOk = false;
        let hasSonar = sonarHost !== null && sonarToken !== null
        let testArg = ["clean","test"];
        if(hasSonar)
            testArg.push("jacocoRootReport","sonar", "-Dsonar.host.url=" + sonarHost,"-Dsonar.login="+sonarToken);
        process.chdir(projectName);
        let projectPath = process.cwd();
        let testResult = this.spawnCommandSync("gradle", testArg);
        process.chdir("../");
        testOk = testResult.status === 0;
        //checks sonarqube quality gate results
        try {
            let sonarQGOk = true;
            if(hasSonar) {
                sonarQGOk = await this.checkSonarQualityGate(projectPath, sonarToken);
            }
            if (testOk && sonarQGOk) {
                this.log.ok("Test for " + projectName + " passed!");
                if(hasSonar)
                    this.log.ok("Sonarqube Quality Gate for " + projectName + " passed!");
            } else if (!testOk) {
                this.log.error("Test for " + projectName + " failed!");
                testOk = false;
            } else {
                this.log.error("Sonarqube Quality Gate for " + projectName + " failed!");
            }
        } catch(error){
            this.log.error(error);
        }
        return testOk;
    }

    async checkSonarQualityGate(projectPath,sonarToken){
        const REPORT_PATH = projectPath + "/build/sonar/report-task.txt";
        if (!fs.existsSync(REPORT_PATH)) {
            this.log.error(`report-task.txt non trovato in ${REPORT_PATH}`);
            process.exit(1);
        }
        const props = fs.readFileSync(REPORT_PATH, "utf8")
            .split("\n")
            .filter(line => line.includes("="))
            .reduce((acc, line) => {
                const i = line.indexOf("=");
                const key = line.substring(0, i).trim();
                const value = line.substring(i + 1).trim();
                acc[key] = value;
                return acc;
            }, {});
        
        let ceTaskUrl = props["ceTaskUrl"];
        if (!ceTaskUrl) {
                this.log.error("ceTaskUrl not found in build/sonar/report-task.txt");
                process.exit(1);
        } else {
                this.log.info("Retrieving Sonar task status from: "+ceTaskUrl);
        }
        let qgResp = await this.fetchSonarStatus(ceTaskUrl,sonarToken);
        this.log.info(`Quality Gate Status IS: ${qgResp}`);
        return qgResp === 'SUCCESS';
    }

    async fetchSonarStatus(ceTaskUrl,sonarToken, retries = 4, delayMs = 2000) {
        let status = "PENDING";
        try {
          // API call to sonarqube
          const response = await axios.get(ceTaskUrl, {
            auth: {
              username: sonarToken,
              password: "",
            },
          });
          status = response.data.task.status;
        } catch (err) {
          if (retries === 0) {
            status = "FAIL";
          } 
        }
        if(status === 'PENDING' || status === 'IN_PROGRESS'){
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return this.fetchSonarStatus(ceTaskUrl, sonarToken, retries - 1, delayMs); 
        }
        return status;
      }
};

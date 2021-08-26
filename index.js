const path = require('path')
const _ = require('lodash')
const yaml = require('js-yaml')
const fs = require('fs')

class Plugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.hooks = {
      'package:createDeploymentArtifacts': this.createDeploymentArtifacts.bind(this)
    }
  }

  createDeploymentArtifacts() {
    if (!this.serverless.service.custom.dns) {
      this.serverless.service.custom.dns = {}
    }

    const baseResources = this.serverless.service.provider.compiledCloudFormationTemplate

    const filename = path.resolve(__dirname, 'resources.yml') // eslint-disable-line
    const content = fs.readFileSync(filename, 'utf-8')
    const resources = yaml.safeLoad(content, {
      filename: filename
    })

    this.prepareResources(resources)
    return _.merge(baseResources, resources)
  }

  prepareResources(resources) {
    if (!this.serverless.service.custom.dns[this.options.region]) {
      this.serverless.cli.log('The dns[region] parameter is required')
      return
    }

    this.prepareApiRegionalDomainName(resources)
    this.prepareApiRegionalBasePathMapping(resources)
    this.prepareApiRegionalHealthCheck(resources)
    this.prepareApiRegionalEndpointRecord(resources)
  }

  prepareApiRegionalDomainName(resources) {
    const properties = resources.Resources.ApiRegionalDomainName.Properties

    const domainName = this.serverless.service.custom.dns.domainName
    if (!domainName) {
      this.serverless.cli.log('The dns.domainName parameter is required')
      return
    }

    const acmCertificateArn = this.serverless.service.custom.dns[this.options.region].acmCertificateArn
    if (!acmCertificateArn) {
      this.serverless.cli.log('The dns[region].acmCertificateArn parameter is required')
      return
    }
    properties.DomainName = domainName
    properties.RegionalCertificateArn = acmCertificateArn
  }

  prepareApiRegionalBasePathMapping(resources) {
    const dependsOn = resources.Resources.ApiRegionalBasePathMapping.DependsOn
    dependsOn[0] = `ApiGatewayDeployment${this.serverless.instanceId}`

    const properties = resources.Resources.ApiRegionalBasePathMapping.Properties
    properties.Stage = this.options.stage
  }

  prepareApiRegionalEndpointRecord(resources) {
    const properties = resources.Resources.ApiRegionalEndpointRecord.Properties

    const hostedZoneId = this.serverless.service.custom.dns.hostedZoneId
    if (!hostedZoneId) {
      this.serverless.cli.log('The dns.hostedZoneId parameter is required')
      return
    }
    properties.HostedZoneId = hostedZoneId
    properties.SetIdentifier = this.options.region

    const failover = this.serverless.service.custom.dns[this.options.region].failover
    if (!failover) {
      this.serverless.cli.log('The dns[region].failover parameter is required')
      return
    }
    properties.Failover = failover
  }

  prepareApiRegionalHealthCheck(resources) {
    const healthCheckResourcePath = this.serverless.service.custom.dns.healthCheckResourcePath
    if (!healthCheckResourcePath) {
      this.serverless.cli.log('The dns.healthCheckResourcePath parameter is required')
      return
    }

    const healthCheckProperties = resources.Resources.ApiRegionalHealthCheck.Properties
    healthCheckProperties.HealthCheckConfig.ResourcePath = `/${this.options.stage}/${healthCheckResourcePath}`
  }
}

module.exports = Plugin

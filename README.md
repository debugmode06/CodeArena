<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/pomelo_white.svg">
    <img alt="Pomelo" src="public/pomelo_black.svg" width="250">
  </picture>
  <p>Self-hosted coding contest and assessment platform.</p>
</div>

## Description
Pomelo is a self-hosted platform designed to manage programming contests, technical assessments, and hackathons. It integrates a Next.js frontend, an Express backend, and the Citron sandboxed code execution engine to provide a complete environment for coding events. The platform is designed for privacy and control, allowing organizers to retain full data sovereignty while operating their own infrastructure.

The system utilizes an automated deployment model via a custom daemon and CLI, simplifying the provisioning of underlying services such as Docker containers and reverse proxies. It provides an administrative interface for managing application state, environment configurations, and container health.


## Installation

Run the following command to download and execute the installation script with root privileges:

```bash
curl -fsSL pomelo.sosc.org.in/install.sh | sudo bash
```

## Usage

Interact with the platform using the global command-line interface.

```bash
pomelo start
pomelo stop
pomelo status
pomelo logs
pomelo ui
```

The administrative interface is accessible via a web browser on port 8462.


## Documentation

For more detailed information, please refer to the official documentation:

- [Documentation](https://pomelo.sosc.org.in/docs/)
- [User Guide](https://pomelo.sosc.org.in/guide/)
- [Troubleshooting](https://pomelo.sosc.org.in/docs/#troubleshooting)

## Contributing
Refer to CONTRIBUTING.md for local development instructions and contribution guidelines.

## License
This project is licensed under the GNU General Public License v3.0 (GPLv3). See the [LICENSE](LICENSE) file for details.

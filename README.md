# nginx-proxy-cloudflare-companion

A cloudflare companion for nginx-proxy

## Features

- Automated creation/modification of Cloudflare records.

## Getting Started

1. Run your nginx-proxy-cloudflare-companion:

   ```yaml
   services:
     cloudflare-companion:
       image: namhtpyn/nginx-proxy-cloudflare-companion:latest
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock
       restart: always
       environment:
         CLOUDFLARE_API_TOKEN: { TOKEN }
   ```

2. Proxied container(s):

   ```yaml
   services:
     your-proxied-app:
       image: your-proxied-app:latest
       environment:
         VIRTUAL_HOST: subdomain.yourdomain.tld
         CF_ENABLE: true
   ```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you encounter any problems.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

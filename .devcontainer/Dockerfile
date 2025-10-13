# Use the official Node.js image as base
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-bullseye

# Arguments for user configuration
ARG USER_UID=1000
ARG USER_GID=1000
ARG INSTALL_PNPM=true

# Update package lists and install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        git \
        curl \
        ca-certificates \
        build-essential \
        gnupg \
        software-properties-common \
        sudo \
        nano \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Create a non-root user (handle case where node user already exists)
RUN if ! getent group node > /dev/null 2>&1; then \
        groupadd --gid $USER_GID node; \
    fi \
    && if ! getent passwd node > /dev/null 2>&1; then \
        useradd --uid $USER_UID --gid $USER_GID -m node; \
    else \
        usermod --uid $USER_UID --gid $USER_GID node; \
    fi \
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install pnpm globally if requested with specific version for reproducibility
RUN if [ "$INSTALL_PNPM" = "true" ]; then \
        npm install -g pnpm@9; \
    fi

# Install starship prompt (as root)
RUN curl -fsSL https://starship.rs/install.sh | sh -s -- --yes

# Install GitHub CLI (as root)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install gh -y


# Switch to the node user
USER node

# Set up starship configuration for node user
RUN mkdir -p /home/node/.config
COPY --chown=node:node .devcontainer/starship.toml /home/node/.config/starship.toml

# Copy and set up custom bashrc with starship and aliases
COPY --chown=node:node .devcontainer/bashrc /home/node/.bashrc

# Set up workspace directory
WORKDIR /workspace


# Set up basic git configuration
RUN git config --global init.defaultBranch main \
    && git config --global pull.rebase false \
    && git config --global core.autocrlf input

# Create directories for persistent volumes
RUN mkdir -p /home/node/.local/share/pnpm \
    && mkdir -p /home/node/.cache

# Set environment variables
ENV NODE_ENV=development

# Default command
CMD ["sleep", "infinity"]
FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build
WORKDIR /src
COPY ["AngJobs.csproj", "./"]
RUN dotnet restore "AngJobs.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "AngJobs.csproj" -c Release -o /app/build

RUN apt-get update && \
    apt-get install -y wget && \
    apt-get install -y gnupg2 && \
    wget -qO- https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get install -y build-essential nodejs

FROM build AS publish
RUN dotnet publish "AngJobs.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AngJobs.dll"]
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AngJobs.Models
{
    public class JobsContext : DbContext
    {
        private IConfiguration _config;
        public JobsContext(IConfiguration config, DbContextOptions options)
        : base(options)
        {
            _config = config;
        }

        public DbSet<Job> Jobs { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);

            optionsBuilder.UseSqlite(_config.GetConnectionString("DefaultConnection"));
        }
    }
}
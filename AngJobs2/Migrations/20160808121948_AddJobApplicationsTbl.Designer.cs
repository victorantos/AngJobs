using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using AngJobs.Models;

namespace AngJobs2.Migrations
{
    [DbContext(typeof(JobsContext))]
    [Migration("20160808121948_AddJobApplicationsTbl")]
    partial class AddJobApplicationsTbl
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("ProductVersion", "1.0.0-rtm-21431");

            modelBuilder.Entity("AngJobs.Models.Applicant", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd();

                    b.Property<DateTime>("DateCreated");

                    b.Property<string>("Email");

                    b.Property<string>("Ip");

                    b.Property<string>("Name");

                    b.Property<string>("Phone");

                    b.Property<string>("Resume");

                    b.HasKey("Id");

                    b.ToTable("Applicants");
                });

            modelBuilder.Entity("AngJobs.Models.Job", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd();

                    b.Property<DateTime>("DateCreated");

                    b.Property<string>("JobTitle");

                    b.Property<string>("Summary");

                    b.HasKey("Id");

                    b.ToTable("Jobs");
                });

            modelBuilder.Entity("AngJobs.Models.JobApplication", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd();

                    b.Property<int?>("ApplicantId");

                    b.Property<string>("ApplicationMessage");

                    b.Property<DateTime>("DateCreated");

                    b.Property<int>("JobId");

                    b.HasKey("Id");

                    b.HasIndex("ApplicantId");

                    b.HasIndex("JobId");

                    b.ToTable("JobApplications");
                });

            modelBuilder.Entity("AngJobs.Models.JobApplication", b =>
                {
                    b.HasOne("AngJobs.Models.Applicant", "Applicant")
                        .WithMany()
                        .HasForeignKey("ApplicantId");

                    b.HasOne("AngJobs.Models.Job", "Job")
                        .WithMany()
                        .HasForeignKey("JobId")
                        .OnDelete(DeleteBehavior.Cascade);
                });
        }
    }
}

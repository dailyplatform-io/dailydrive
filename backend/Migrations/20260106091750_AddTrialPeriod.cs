using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ride.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTrialPeriod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "TrialEndsAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TrialEndsAt",
                table: "AspNetUsers");
        }
    }
}

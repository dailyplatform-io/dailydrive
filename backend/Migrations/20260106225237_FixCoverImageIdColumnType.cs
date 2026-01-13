using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ride.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixCoverImageIdColumnType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "CoverImageId",
                table: "Cars",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            // Check if TrialEndsAt column already exists before adding it
            // Remove the TrialEndsAt column addition since it already exists from a previous migration
            // migrationBuilder.AddColumn<DateTime>(
            //     name: "TrialEndsAt",
            //     table: "AspNetUsers",
            //     type: "datetime2",
            //     nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove the TrialEndsAt column drop since we didn't add it in Up()
            // migrationBuilder.DropColumn(
            //     name: "TrialEndsAt",
            //     table: "AspNetUsers");

            migrationBuilder.AlterColumn<Guid>(
                name: "CoverImageId",
                table: "Cars",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}

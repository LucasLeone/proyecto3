#!/usr/bin/env node

/**
 * Script para generar un reporte detallado del análisis estático
 * 
 * Ejecutar con: node eslint-analysis.js
 */

import { ESLint } from 'eslint';
import fs from 'fs/promises';

async function analyzeCode() {
  console.log('🔍 Iniciando análisis estático del código...\n');

  const eslint = new ESLint();
  const results = await eslint.lintFiles(['src/**/*.{js,jsx}']);

  // Estadísticas generales
  let totalErrors = 0;
  let totalWarnings = 0;
  let filesWithIssues = 0;
  
  // Métricas específicas
  const metrics = {
    buenasPracticas: {
      name: 'Adherencia a Buenas Prácticas y Code Smells',
      rules: [
        'react-hooks/rules-of-hooks',
        'react-hooks/exhaustive-deps',
        'react/jsx-key',
        'jsx-a11y/alt-text',
        'no-console',
        'react/jsx-no-duplicate-props',
        'react/jsx-no-undef',
        'react/no-direct-mutation-state',
      ],
      errors: 0,
      warnings: 0,
      files: new Set(),
    },
    complejidad: {
      name: 'Complejidad del Código',
      rules: [
        'complexity',
        'max-lines-per-function',
        'max-depth',
        'max-nested-callbacks',
        'max-params',
      ],
      errors: 0,
      warnings: 0,
      files: new Set(),
    },
    erroresPotenciales: {
      name: 'Errores Potenciales y Riesgos de Mantenimiento',
      rules: [
        'no-unused-vars',
        'no-undef',
        'no-unreachable',
        'no-constant-condition',
        'no-dupe-args',
        'no-dupe-keys',
        'eqeqeq',
        'no-eval',
      ],
      errors: 0,
      warnings: 0,
      files: new Set(),
    },
  };

  // Analizar resultados
  results.forEach((result) => {
    if (result.errorCount > 0 || result.warningCount > 0) {
      filesWithIssues++;
      totalErrors += result.errorCount;
      totalWarnings += result.warningCount;

      result.messages.forEach((message) => {
        // Clasificar por métrica
        Object.keys(metrics).forEach((metricKey) => {
          const metric = metrics[metricKey];
          if (metric.rules.includes(message.ruleId)) {
            if (message.severity === 2) {
              metric.errors++;
            } else {
              metric.warnings++;
            }
            metric.files.add(result.filePath);
          }
        });
      });
    }
  });

  // Generar reporte en consola
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DEL ANÁLISIS ESTÁTICO');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📁 Archivos analizados: ${results.length}`);
  console.log(`⚠️  Archivos con problemas: ${filesWithIssues}`);
  console.log(`🔴 Total de errores: ${totalErrors}`);
  console.log(`🟡 Total de advertencias: ${totalWarnings}`);
  console.log(`📈 Total de problemas: ${totalErrors + totalWarnings}\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 ANÁLISIS POR MÉTRICA');
  console.log('═══════════════════════════════════════════════════════════\n');

  Object.keys(metrics).forEach((metricKey, index) => {
    const metric = metrics[metricKey];
    const totalIssues = metric.errors + metric.warnings;
    const filesAffected = metric.files.size;

    console.log(`${index + 1}. ${metric.name}`);
    console.log(`   🔴 Errores: ${metric.errors}`);
    console.log(`   🟡 Advertencias: ${metric.warnings}`);
    console.log(`   📁 Archivos afectados: ${filesAffected}`);
    console.log(`   📊 Total: ${totalIssues}\n`);
  });

  // Top 10 archivos con más problemas
  const fileStats = results
    .filter((r) => r.errorCount + r.warningCount > 0)
    .map((r) => ({
      file: r.filePath.replace(process.cwd(), '.'),
      errors: r.errorCount,
      warnings: r.warningCount,
      total: r.errorCount + r.warningCount,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (fileStats.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🏆 TOP 10 ARCHIVOS CON MÁS PROBLEMAS');
    console.log('═══════════════════════════════════════════════════════════\n');

    fileStats.forEach((stat, index) => {
      console.log(`${index + 1}. ${stat.file}`);
      console.log(`   🔴 ${stat.errors} errores | 🟡 ${stat.warnings} advertencias | 📊 ${stat.total} total\n`);
    });
  }

  // Generar reporte JSON
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesAnalyzed: results.length,
      filesWithIssues,
      totalErrors,
      totalWarnings,
      totalProblems: totalErrors + totalWarnings,
    },
    metrics: Object.keys(metrics).reduce((acc, key) => {
      acc[key] = {
        name: metrics[key].name,
        errors: metrics[key].errors,
        warnings: metrics[key].warnings,
        filesAffected: metrics[key].files.size,
        total: metrics[key].errors + metrics[key].warnings,
      };
      return acc;
    }, {}),
    topFiles: fileStats,
  };

  await fs.writeFile(
    'eslint-analysis-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Análisis completado');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📄 Reporte JSON generado: eslint-analysis-report.json\n');

  // Calcular puntuación de calidad (0-100)
  const totalPossibleIssues = results.length * 10; // Aproximación
  const qualityScore = Math.max(
    0,
    Math.min(100, 100 - (totalErrors + totalWarnings * 0.5) / totalPossibleIssues * 100)
  );

  console.log(`🎯 Puntuación de Calidad: ${qualityScore.toFixed(2)}/100\n`);

  if (qualityScore >= 90) {
    console.log('🌟 ¡Excelente! El código tiene muy buena calidad.\n');
  } else if (qualityScore >= 70) {
    console.log('👍 Buena calidad, pero hay margen de mejora.\n');
  } else if (qualityScore >= 50) {
    console.log('⚠️  Calidad aceptable, se recomienda refactorización.\n');
  } else {
    console.log('🚨 Atención: Se requiere trabajo significativo para mejorar la calidad.\n');
  }

  return totalErrors > 0 ? 1 : 0;
}

analyzeCode()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('❌ Error durante el análisis:', error);
    process.exit(1);
  });

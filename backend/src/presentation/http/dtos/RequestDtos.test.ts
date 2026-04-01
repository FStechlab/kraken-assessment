import { validate } from 'class-validator';
import { AnalyzeCoverageDto, StartImprovementDto } from './RequestDtos';

describe('RequestDtos', () => {
  describe('AnalyzeCoverageDto', () => {
    it('should validate a valid AnalyzeCoverageDto', async () => {
      const dto = new AnalyzeCoverageDto();
      dto.repositorySlug = 'owner/repo';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate a valid AnalyzeCoverageDto with threshold', async () => {
      const dto = new AnalyzeCoverageDto();
      dto.repositorySlug = 'owner/repo';
      dto.threshold = 50;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should not validate an invalid AnalyzeCoverageDto', async () => {
      const dto = new AnalyzeCoverageDto();
      dto.repositorySlug = '';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should not validate an invalid AnalyzeCoverageDto with invalid repositorySlug', async () => {
      const dto = new AnalyzeCoverageDto();
      dto.repositorySlug = 'invalid';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should not validate an invalid AnalyzeCoverageDto with threshold out of range', async () => {
      const dto = new AnalyzeCoverageDto();
      dto.repositorySlug = 'owner/repo';
      dto.threshold = -1;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should not validate an invalid AnalyzeCoverageDto with threshold out of range (max)', async () => {
      const dto = new AnalyzeCoverageDto();
      dto.repositorySlug = 'owner/repo';
      dto.threshold = 101;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('StartImprovementDto', () => {
    it('should validate a valid StartImprovementDto', async () => {
      const dto = new StartImprovementDto();
      dto.repositorySlug = 'owner/repo';
      dto.filePath = 'path/to/file';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should not validate an invalid StartImprovementDto', async () => {
      const dto = new StartImprovementDto();
      dto.repositorySlug = '';
      dto.filePath = '';
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });

    it('should not validate an invalid StartImprovementDto with invalid repositorySlug', async () => {
      const dto = new StartImprovementDto();
      dto.repositorySlug = 'invalid';
      dto.filePath = 'path/to/file';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should not validate an invalid StartImprovementDto with empty filePath', async () => {
      const dto = new StartImprovementDto();
      dto.repositorySlug = 'owner/repo';
      dto.filePath = '';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });
});